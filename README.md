# 📊 Expense Tracker App

![Go](https://img.shields.io/badge/Go-1.24%2B-blue.svg)
![React](https://img.shields.io/badge/React-19%2B-61DAFB.svg)
![Status](https://img.shields.io/badge/status-active-brightgreen)

A simple yet powerful web application to help you track personal finances by parsing Revolut PDF statements and allowing for manual entry.  
This project is built with a **Go backend** and a **React frontend**.

---

## ✨ Features

- 📄 **Automatic PDF Import**: Upload your Revolut PDF bank statements to automatically parse and import all transactions.
- ✍️ **Manual Entry**: Manually add individual income or expense transactions through a smart, user-friendly form.
- 🕒 **Chronological View**: View all transactions in a clean table, automatically sorted from newest to oldest.
- 📅 **Monthly Filtering & Summary**:
  - Filter your transactions by month and year using a simple dropdown menu.
  - Instantly see the total income and total spending for the selected period.
- 📂 **Grouped Data Display**: When viewing all transactions, they are neatly grouped by month with clear headers.
- 🎨 **Intuitive UI**:
  - Amounts are color-coded: 🟢 green for income and 🔴 red for expenses.
  - Currency is formatted for readability.
  - A responsive and modern design.

---

## 🛠️ Tech Stack

### ⚙️ Backend

| Technology        | Purpose                      |
|-------------------|------------------------------|
| Go (Golang)       | Core programming language     |
| gorilla/mux       | HTTP routing                  |
| sqlite3           | Simple, file-based database   |
| unidoc/unipdf     | Robust PDF text extraction    |
| joho/godotenv     | Managing environment variables|

### 🎨 Frontend

| Technology        | Purpose                       |
|-------------------|-------------------------------|
| React & TypeScript| UI framework                  |
| axios             | API requests to the backend   |
| CSS-in-JS         | Component-level styling       |

---

## 🚀 Getting Started

Follow these steps to get the application running on your local machine.

### ✅ Prerequisites

- Go (version 1.24 or newer)
- Node.js and npm (version 16 or newer)

---

### 1️⃣ Backend Setup

Navigate to the backend directory:

```sh
cd backend
```

Install Go dependencies:
```
go mod tidy
```

Create the configuration file .env:
This project uses the UniPDF library, which requires a license key. You can get a free community license for non-commercial use.

1. Go to UniDoc's Community License Page to get your free key.
2. Create a .env file inside the backend directory and add the following:

```
backend/.env
UNIPDF_LICENSE_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Run the backend server:
```
go run main.go
```

The server will start on http://localhost:8080.
You should see log messages indicating a successful database connection and server start.

### 2️⃣ Frontend Setup

Navigate to the frontend directory:

```sh
cd frontend
```

Install dependencies:
```
npm install
```

Run the frontend development server:
```
npm run dev
```
This will open the application in your browser, usually at http://localhost:5173.
The frontend is configured to automatically proxy API requests to the backend server.

### 💻 Usage

- Open your browser and go to http://localhost:5173.
- Upload a Statement: Click Choose File, select a Revolut PDF statement, and click Upload.
- Add Manually: Use the Manual Entry form to add a single transaction. Select the type ("Expense" or "Income") to enable the amount field.
- Filter Data: Use the Filter by month dropdown to view a specific month's transactions and see the income/spending summary.

### Happy Coding! 🎉