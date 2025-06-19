package models

import (
	"database/sql"
	"log"

	_ "github.com/mattn/go-sqlite3"
)

type Expense struct {
	ID          int    `json:"id"`
	Date        string `json:"date"`
	Category    string `json:"category"`
	Amount      string `json:"amount"`
	Description string `json:"description"`
}

var db *sql.DB

func init() {
	var err error
	db, err = sql.Open("sqlite3", "./expenses.db")
	if err != nil {
		log.Fatal(err)
	}

	log.Println("Connected to DB")

	createTable := `
	CREATE TABLE IF NOT EXISTS expenses (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		date TEXT,
		category TEXT,
		amount TEXT,
		description TEXT
	);
	`

	_, err = db.Exec(createTable)
	if err != nil {
		log.Fatal(err)
	}
}

func GetAllExpenses() []Expense {
	rows, _ := db.Query("SELECT id, date, category, amount, description FROM expenses")
	defer rows.Close()

	var expenses []Expense
	for rows.Next() {
		var e Expense
		rows.Scan(&e.ID, &e.Date, &e.Category, &e.Amount, &e.Description)
		expenses = append(expenses, e)
	}
	return expenses
}

func AddExpense(e Expense) {
	stmt, _ := db.Prepare("INSERT INTO expenses(date, category, amount, description) VALUES(?,?,?,?)")
	stmt.Exec(e.Date, e.Category, e.Amount, e.Description)
}
