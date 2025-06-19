import { useEffect, useMemo, useState } from "react";
import axios from "axios";

// --- TYPE DEFINITIONS ---
type Expense = {
  id: string | number;
  date: string;
  category: string;
  amount: string | number;
  description: string;
};

type GroupedExpenses = {
  [key: string]: Expense[];
};

// --- STYLING OBJECT ---
const styles = {
  body: {
    backgroundColor: "#eef2f5",
  },
  container: {
    padding: "20px 40px",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    maxWidth: "900px",
    margin: "40px auto",
    color: "#333",
  },
  section: {
    backgroundColor: "#ffffff",
    border: "1px solid #ddd",
    borderRadius: "8px",
    padding: "20px",
    marginBottom: "30px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
  },
  h1: {
    color: "#1a1a1a",
    borderBottom: "2px solid #eee",
    paddingBottom: "10px",
  },
  h3: {
    marginTop: 0,
    color: "#444",
  },
  input: {
    padding: "10px",
    marginRight: "10px",
    marginBottom: "10px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    width: "calc(25% - 14px)", // Default width for 4 inputs
  },
  button: {
    padding: "10px 15px",
    border: "none",
    borderRadius: "4px",
    backgroundColor: "#007bff",
    color: "white",
    cursor: "pointer",
    fontSize: "16px",
    transition: "background-color 0.2s",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    marginTop: "20px",
  },
  th: {
    backgroundColor: "#f8f9fa",
    borderBottom: "2px solid #dee2e6",
    padding: "12px",
    textAlign: "left",
  },
  td: {
    borderBottom: "1px solid #eee",
    padding: "12px",
  },
  filterContainer: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    marginBottom: "20px",
  },
  select: {
    padding: "10px",
    fontSize: "16px",
    borderRadius: "4px",
    border: "1px solid #ccc",
  },
  summaryBox: {
    display: "flex",
    gap: "20px",
    fontSize: "1.1em",
  },
  totalIncome: {
    color: "#28a745",
    fontWeight: "bold",
  },
  totalExpense: {
    color: "#dc3545",
    fontWeight: "bold",
  },
  monthHeader: {
    backgroundColor: "#e9ecef",
    padding: "10px 12px",
    fontWeight: "bold",
    fontSize: "1.2em",
    color: "#495057",
  },
  disabledInput: {
    backgroundColor: "#e9ecef",
    cursor: "not-allowed",
  },
};

// --- HELPER FUNCTIONS ---
const formatMonthYear = (key: string) => {
  const [year, month] = key.split("-");
  return new Date(Number(year), Number(month) - 1).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
};

function App() {
  // --- STATE MANAGEMENT ---
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [groupedExpenses, setGroupedExpenses] = useState<GroupedExpenses>({});
  const [selectedMonth, setSelectedMonth] = useState<string>("all");

  // State for the manual entry form
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0], // Default to today
    category: "", // "Expense" or "Income"
    description: "",
    amount: "", // Will hold the final signed value
  });
  // Separate state for the user's raw amount input
  const [rawAmount, setRawAmount] = useState("");

  // --- SIDE EFFECTS ---
  useEffect(() => {
    document.body.style.backgroundColor = styles.body.backgroundColor;
    return () => {
      document.body.style.backgroundColor = "";
    };
  }, []);

  useEffect(() => {
    axios.get("/api/expenses").then((res) => {
      if (res.data) {
        const sortedData = res.data.sort(
          (a: Expense, b: Expense) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setExpenses(sortedData);

        interface ExpenseGroupAccumulator {
          [key: string]: Expense[];
        }

        const groups: GroupedExpenses = sortedData.reduce(
          (acc: ExpenseGroupAccumulator, expense: Expense) => {
            const date: Date = new Date(expense.date);
            const year: number = date.getFullYear();
            const month: string = String(date.getMonth() + 1).padStart(2, "0");
            const key: string = `${year}-${month}`;

            if (!acc[key]) {
              acc[key] = [];
            }
            acc[key].push(expense);
            return acc;
          },
          {} as ExpenseGroupAccumulator
        );
        setGroupedExpenses(groups);
      }
    });
  }, []);

  // --- DERIVED STATE & CALCULATIONS ---
  const { transactionsToShow, totalIncome, totalExpense } = useMemo(() => {
    const isAllMonths = selectedMonth === "all";
    const transactions = isAllMonths
      ? expenses
      : groupedExpenses[selectedMonth] || [];

    let income = 0;
    let expense = 0;

    transactions.forEach((t) => {
      const amount = Number(t.amount);
      if (amount > 0) {
        income += amount;
      } else {
        expense += amount;
      }
    });

    return {
      transactionsToShow: transactions,
      totalIncome: income,
      totalExpense: expense,
    };
  }, [selectedMonth, expenses, groupedExpenses]);

  // --- EVENT HANDLERS ---
  const handleUpload = () => {
    if (!file) {
      alert("Please select a PDF file to upload.");
      return;
    }
    const data = new FormData();
    data.append("file", file);
    axios.post("/api/upload", data).then((res) => {
      alert(res.data);
      window.location.reload();
    });
  };

  const addExpense = () => {
    // Validation
    if (
      !form.date.trim() ||
      !form.category.trim() ||
      !rawAmount.trim() ||
      !form.description.trim()
    ) {
      alert("Please fill out all fields before adding.");
      return;
    }

    // Prepare final data with signed amount
    const finalAmount =
      form.category === "Expense" ? `-${rawAmount}` : rawAmount;
    const dataToSubmit = { ...form, amount: finalAmount };

    axios.post("/api/expenses", dataToSubmit).then(() => {
      alert("Transaction added successfully!");
      window.location.reload();
    });
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.h1}>My Expense Tracker</h1>

      <div style={styles.section}>
        <label htmlFor="file-upload" style={{ marginRight: "10px" }}>
          PDF File:
        </label>
        <input
          id="file-upload"
          className="file-upload-input"
          type="file"
          accept=".pdf"
          title="Upload your PDF statement"
          placeholder="Choose a PDF file"
          onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
        />
        <button style={styles.button} onClick={handleUpload}>
          Upload
        </button>
      </div>

      <div style={styles.section}>
        <h3 style={styles.h3}>Manual Entry</h3>
        <label htmlFor="date-input" style={{ marginRight: "10px" }}>
          Date:
        </label>
        <input
          className="custom-input"
          id="date-input"
          type="date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          title="Select transaction date"
          placeholder="Select date"
        />
        <select
          className="custom-select"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          title="Select transaction type"
        >
          <option value="" disabled>
            -- Select Type --
          </option>
          <option value="Expense">Expense</option>
          <option value="Income">Income</option>
        </select>
        <input
          style={{
            ...styles.input,
            ...(form.category === "" ? styles.disabledInput : {}),
          }}
          placeholder="Amount"
          type="number"
          value={rawAmount}
          onChange={(e) => setRawAmount(e.target.value)}
          disabled={form.category === ""}
        />
        <input
          style={styles.input}
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <button style={styles.button} onClick={addExpense}>
          Add Transaction
        </button>
      </div>

      <div style={styles.section}>
        <h3 style={styles.h3}>View Expenses</h3>
        <div style={styles.filterContainer}>
          <select
            id="month-select"
            className="custom-select"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            title="Filter by month"
          >
            <option value="all">All Months</option>
            {Object.keys(groupedExpenses).map((monthKey) => (
              <option key={monthKey} value={monthKey}>
                {formatMonthYear(monthKey)}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.summaryBox}>
          <div>
            Total Income:{" "}
            <span style={styles.totalIncome}>
              {totalIncome.toLocaleString("hu-HU", {
                style: "currency",
                currency: "HUF",
              })}
            </span>
          </div>
          <div>
            Total Spending:{" "}
            <span style={styles.totalExpense}>
              {totalExpense.toLocaleString("hu-HU", {
                style: "currency",
                currency: "HUF",
              })}
            </span>
          </div>
        </div>

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th as React.CSSProperties}>Date</th>
              <th style={styles.th as React.CSSProperties}>Description</th>
              <th style={styles.th as React.CSSProperties}>Amount (HUF)</th>
              <th style={styles.th as React.CSSProperties}>Category</th>
            </tr>
          </thead>
          <tbody>
            {selectedMonth === "all"
              ? Object.entries(groupedExpenses).map(
                  ([monthKey, monthExpenses]) => (
                    <>
                      <tr key={monthKey}>
                        <td colSpan={4} style={styles.monthHeader}>
                          {formatMonthYear(monthKey)}
                        </td>
                      </tr>
                      {monthExpenses.map((e) => (
                        <tr key={e.id}>
                          <td style={styles.td}>
                            {new Date(e.date).toLocaleDateString()}
                          </td>
                          <td style={styles.td}>{e.description}</td>
                          <td
                            style={{
                              ...styles.td,
                              color: Number(e.amount) < 0 ? "red" : "green",
                            }}
                          >
                            {Number(e.amount).toLocaleString("hu-HU", {
                              style: "currency",
                              currency: "HUF",
                            })}
                          </td>
                          <td style={styles.td}>{e.category}</td>
                        </tr>
                      ))}
                    </>
                  )
                )
              : transactionsToShow.map((e) => (
                  <tr key={e.id}>
                    <td style={styles.td}>
                      {new Date(e.date).toLocaleDateString()}
                    </td>
                    <td style={styles.td}>{e.description}</td>
                    <td
                      style={{
                        ...styles.td,
                        color: Number(e.amount) < 0 ? "red" : "green",
                      }}
                    >
                      {Number(e.amount).toLocaleString("hu-HU", {
                        style: "currency",
                        currency: "HUF",
                      })}
                    </td>
                    <td style={styles.td}>{e.category}</td>
                  </tr>
                ))}
            {transactionsToShow.length === 0 && (
              <tr>
                <td colSpan={4} style={{ ...styles.td, textAlign: "center" }}>
                  No transactions for this period.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
