package main

import (
	"log"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/javy99/expense-tracker/handlers"
)

func main() {
	router := mux.NewRouter()

	router.HandleFunc("/api/expenses", handlers.GetExpenses).Methods("GET")
	router.HandleFunc("/api/expenses", handlers.AddExpense).Methods("POST")
	router.HandleFunc("/api/upload", handlers.UploadPDF).Methods("POST")

	log.Println("Server running on :8080")
	log.Fatal(http.ListenAndServe(":8080", router))

}
