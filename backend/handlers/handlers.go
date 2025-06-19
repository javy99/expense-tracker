package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"regexp"
	"strings"

	"github.com/javy99/expense-tracker/models"
	"github.com/joho/godotenv"

	"github.com/unidoc/unipdf/v3/common/license"
	"github.com/unidoc/unipdf/v3/extractor"
	"github.com/unidoc/unipdf/v3/model"
)

// The init function is the perfect place to load environment variables and set the license key.
func init() {
	// Load values from .env file into the system
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	// Get the license key from the environment variables
	licenseKey := os.Getenv("LICENSE_KEY")
	if licenseKey == "" {
		log.Fatal("UNIPDF_LICENSE_KEY environment variable not set.")
	}

	// Set the metered key
	err := license.SetMeteredKey(licenseKey)
	if err != nil {
		log.Fatalf("Failed to set UniPDF license key: %v", err)
	}

	log.Println("UniPDF license key set successfully.")
}

func GetExpenses(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	expenses := models.GetAllExpenses()
	json.NewEncoder(w).Encode(expenses)
}

func AddExpense(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	var expense models.Expense
	json.NewDecoder(r.Body).Decode(&expense)
	models.AddExpense(expense)
	json.NewEncoder(w).Encode(expense)
}

// UploadPDF handles the parsing of the Revolut PDF statement
func UploadPDF(w http.ResponseWriter, r *http.Request) {
	file, header, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "Could not read uploaded file", http.StatusBadRequest)
		return
	}
	defer file.Close()

	log.Printf("Uploaded file: %s, size: %d", header.Filename, header.Size)

	// Step 1: Extract all text from the PDF
	pdfText, err := extractTextFromPDF(file)
	if err != nil {
		log.Printf("Error extracting text from PDF: %v", err)
		http.Error(w, "Failed to parse PDF file", http.StatusInternalServerError)
		return
	}

	// Step 2: Parse the extracted text to find transactions
	expenses := parseRevolutStatement(pdfText)

	// Step 3: Add the found expenses to the database
	for _, expense := range expenses {
		models.AddExpense(expense)
	}

	log.Printf("Successfully parsed and added %d expenses to the database.", len(expenses))
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, "Uploaded and processed %d transactions.", len(expenses))
}

// extractTextFromPDF uses the unipdf library to get plain text from a PDF
// CORRECTED: Changed io.Reader to io.ReadSeeker to satisfy the unipdf library requirements.
func extractTextFromPDF(file io.ReadSeeker) (string, error) {
	pdfReader, err := model.NewPdfReader(file)
	if err != nil {
		return "", err
	}

	var allText strings.Builder
	numPages, err := pdfReader.GetNumPages()
	if err != nil {
		return "", err
	}

	for i := 1; i <= numPages; i++ {
		page, err := pdfReader.GetPage(i)
		if err != nil {
			return "", err
		}

		ex, err := extractor.New(page)
		if err != nil {
			return "", err
		}

		text, err := ex.ExtractText()
		if err != nil {
			return "", err
		}
		allText.WriteString(text)
		allText.WriteString("\n") // Add a newline between pages
	}

	return allText.String(), nil
}

// parseRevolutStatement uses Regex to find transaction lines in the extracted text
func parseRevolutStatement(text string) []models.Expense {
	var expenses []models.Expense

	// Regex for "Money out" transactions
	// Groups: 1=Date, 2=Description, 3=Amount
	reOut := regexp.MustCompile(`(?m)^((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s\d{1,2},\s\d{4})\s+(.+?)\s+([\d,]+\.\d{2})\sHUF`)
	matchesOut := reOut.FindAllStringSubmatch(text, -1)

	for _, match := range matchesOut {
		if len(match) == 4 {
			date := match[1]
			description := strings.TrimSpace(match[2])
			amount := strings.ReplaceAll(match[3], ",", "")

			expense := models.Expense{
				Date:        date,
				Amount:      "-" + amount,
				Description: description,
				Category:    "Expense",
			}
			expenses = append(expenses, expense)
			log.Printf("Parsed Expense: Date=%s, Desc=%s, Amount=%s", expense.Date, expense.Description, expense.Amount)
		}
	}

	// Regex for "Money in" transactions (e.g., Top-ups, transfers)
	// Groups: 1=Date, 2=Description, 3=Amount
	reIn := regexp.MustCompile(`(?m)^((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s\d{1,2},\s\d{4})\s+(Apple Pay Top-Up.*?|Transfer from.*?|Goodwill)\s+([\d,]+\.\d{2})\sHUF`)
	matchesIn := reIn.FindAllStringSubmatch(text, -1)
	for _, match := range matchesIn {
		if len(match) == 4 { // The full match + 3 capture groups
			date := match[1]
			description := strings.TrimSpace(match[2])
			amount := strings.ReplaceAll(match[3], ",", "")

			expense := models.Expense{
				Date:        date,
				Amount:      amount,
				Description: description,
				Category:    "Income",
			}
			expenses = append(expenses, expense)
			log.Printf("Parsed Income: Date=%s, Desc=%s, Amount=%s", expense.Date, expense.Description, expense.Amount)
		}
	}
	return expenses
}
