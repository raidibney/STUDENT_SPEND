
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ChangeEvent, FormEvent } from "react";

interface Expense {
  id: number;
  title: string;
  amount: string;
  category: string;
  date: string;
  description: string;
}

interface ExpenseForm {
  title: string;
  amount: string;
  category: string;
  date: string;
  description: string;
}

const API = "http://127.0.0.1:8000/api/expenses/";

const emptyForm: ExpenseForm = {
  title: "",
  amount: "",
  category: "food",
  date: "",
  description: "",
};

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ExpenseForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");

  // Fetch all expenses
  const fetchExpenses = async () => {
    try {
      setLoading(true);

      const response = await fetch(API);

      if (!response.ok) {
        throw new Error("Failed to load expenses");
      }

      const data = await response.json();

      setExpenses(Array.isArray(data) ? data : data.results || []);
      setError("");
    } catch {
      setError("Could not connect to Django server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  // Open edit form
  const startEditing = (expense: Expense) => {
    setEditingId(expense.id);

    setFormData({
      title: expense.title,
      amount: String(expense.amount),
      category: expense.category,
      date: expense.date,
      description: expense.description || "",
    });

    setEditError("");
  };

  // Handle edit form changes
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Update expense using PATCH
  const handleUpdate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setEditError("");

    if (!formData.title.trim()) {
      setEditError("Please enter an expense title.");
      return;
    }

    if (!formData.amount || Number(formData.amount) <= 0) {
      setEditError("Please enter a valid amount.");
      return;
    }

    if (!editingId) return;

    try {
      setSaving(true);

      const response = await fetch(`${API}${editingId}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          title: formData.title.trim(),
          amount: Number(formData.amount),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
      }

      const updatedExpense: Expense = await response.json();

      setExpenses((previous) =>
        previous.map((expense) =>
          expense.id === editingId ? updatedExpense : expense
        )
      );

      setEditingId(null);
      setFormData(emptyForm);

      alert("Expense updated successfully!");
    } catch (err) {
      setEditError(
        err instanceof Error ? err.message : "Could not update expense."
      );
    } finally {
      setSaving(false);
    }
  };

  // Delete expense
  const deleteExpense = async (id: number) => {
    if (!confirm("Are you sure you want to delete this expense?")) {
      return;
    }

    try {
      const response = await fetch(`${API}${id}/`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Delete failed");
      }

      setExpenses((previous) =>
        previous.filter((expense) => expense.id !== id)
      );
    } catch {
      alert("Could not delete expense.");
    }
  };

  // Search and category filter
  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch =
      expense.title.toLowerCase().includes(search.toLowerCase()) ||
      (expense.description || "").toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      category === "all" || expense.category === category;

    return matchesSearch && matchesCategory;
  });

  const total = filteredExpenses.reduce(
    (sum, expense) => sum + Number(expense.amount),
    0
  );

  return (
    <main className="min-h-screen bg-slate-100 p-6 md:p-10">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Expense List
            </h1>
            <p className="mt-2 text-slate-600">
              Manage all your student expenses.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/"
              className="rounded-lg border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700"
            >
              Dashboard
            </Link>

            <Link
              href="/expenses/new"
              className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white"
            >
              + Add Expense
            </Link>
          </div>
        </div>

        {/* Edit Form */}
        {editingId !== null && (
          <div className="mb-8 rounded-2xl border border-blue-200 bg-white p-6 shadow-md">
            <h2 className="mb-5 text-2xl font-bold text-slate-900">
              Edit Expense #{editingId}
            </h2>

            <form onSubmit={handleUpdate} className="space-y-5">

              <div>
                <label className="mb-2 block font-semibold">
                  Expense Title
                </label>
                <input
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-slate-300 p-3"
                />
              </div>

              <div>
                <label className="mb-2 block font-semibold">
                  Amount (BDT ৳)
                </label>
                <input
                  name="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={formData.amount}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-slate-300 p-3"
                />
              </div>

              <div>
                <label className="mb-2 block font-semibold">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 bg-white p-3"
                >
                  <option value="food">Food</option>
                  <option value="transport">Transport</option>
                  <option value="education">Education</option>
                  <option value="shopping">Shopping</option>
                  <option value="entertainment">Entertainment</option>
                  <option value="health">Health</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block font-semibold">
                  Expense Date
                </label>
                <input
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-slate-300 p-3"
                />
              </div>

              <div>
                <label className="mb-2 block font-semibold">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 p-3"
                />
              </div>

              {editError && (
                <p className="whitespace-pre-wrap rounded-lg bg-red-100 p-3 text-red-700">
                  {editError}
                </p>
              )}

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Updating..." : "Save Changes"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setFormData(emptyForm);
                    setEditError("");
                  }}
                  className="rounded-lg bg-slate-200 px-6 py-3 font-semibold text-slate-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Summary */}
        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-slate-500">Total Records</p>
            <h2 className="mt-2 text-3xl font-bold">
              {filteredExpenses.length}
            </h2>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-slate-500">Total Amount</p>
            <h2 className="mt-2 text-3xl font-bold text-red-600">
              ৳{total.toLocaleString("en-BD")}
            </h2>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-5 grid gap-4 rounded-xl bg-white p-5 shadow-sm md:grid-cols-2">
          <input
            type="text"
            placeholder="Search expense..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border border-slate-300 p-3 outline-none focus:border-blue-500"
          />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-lg border border-slate-300 p-3"
          >
            <option value="all">All Categories</option>
            <option value="food">Food</option>
            <option value="transport">Transport</option>
            <option value="education">Education</option>
            <option value="shopping">Shopping</option>
            <option value="entertainment">Entertainment</option>
            <option value="health">Health</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Expense Table */}
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          {loading ? (
            <p className="p-8 text-center">Loading expenses...</p>
          ) : error ? (
            <p className="p-8 text-center text-red-600">{error}</p>
          ) : filteredExpenses.length === 0 ? (
            <p className="p-8 text-center text-slate-500">
              No expenses found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="p-4">Title</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredExpenses.map((expense) => (
                    <tr
                      key={expense.id}
                      className="border-t border-slate-100"
                    >
                      <td className="p-4">
                        <p className="font-semibold">{expense.title}</p>
                        <p className="text-sm text-slate-500">
                          {expense.description}
                        </p>
                      </td>

                      <td className="p-4 capitalize">
                        {expense.category}
                      </td>

                      <td className="p-4">{expense.date}</td>

                      <td className="p-4 font-bold text-red-600">
                        ৳{Number(expense.amount).toLocaleString("en-BD")}
                      </td>

                      <td className="p-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => startEditing(expense)}
                            className="rounded-lg bg-blue-100 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-200"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => deleteExpense(expense.id)}
                            className="rounded-lg bg-red-100 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-200"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
