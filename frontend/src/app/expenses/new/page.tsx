
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ChangeEvent, FormEvent } from "react";

interface ExpenseForm {
  title: string;
  amount: string;
  category: string;
  date: string;
  description: string;
}

export default function AddExpensePage() {
  const router = useRouter();

const [formData, setFormData] = useState<ExpenseForm>({
  title: "",
  amount: "",
  category: "food",
  date: "",
  description: "",
});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Handle input changes
  function handleChange(
    e: ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  // Submit expense to Django backend
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!formData.title.trim()) {
      setError("Please enter an expense title.");
      return;
    }

    if (!formData.amount || Number(formData.amount) <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://127.0.0.1:8000/api/expenses/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: formData.title.trim(),
            amount: Number(formData.amount),
            category: formData.category,
            date: formData.date,
            description: formData.description,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();

        const errorMessage =
          typeof errorData === "object"
            ? Object.entries(errorData)
                .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
                .join("\n")
            : "Failed to save expense.";

        throw new Error(errorMessage);
      }

      alert("Expense added successfully!");

      router.push("/");
      router.refresh();

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-5 py-10">
      <div className="mx-auto max-w-2xl">

        {/* Page Heading */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Add New Expense
          </h1>

          <p className="mt-2 text-slate-600">
            Record your spending and manage your money wisely.
          </p>
        </div>

        {/* Expense Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl bg-white p-8 shadow-md"
        >

          {/* Expense Title */}
          <div>
            <label className="mb-2 block font-semibold text-slate-700">
              Expense Title
            </label>

            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. University Lunch"
              required
              className="w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="mb-2 block font-semibold text-slate-700">
              Amount (BDT ৳)
            </label>

            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="e.g. 250"
              min="0.01"
              step="0.01"
              required
              className="w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Category */}
          <div>
            <label className="mb-2 block font-semibold text-slate-700">
              Category
            </label>

            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 bg-white p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="food">Food</option>
              <option value="transport">Transport</option>
              <option value="shopping">Shopping</option>
              <option value="education">Education</option>
              <option value="entertainment">Entertainment</option>
              <option value="health">Health</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="mb-2 block font-semibold text-slate-700">
              Expense Date
            </label>

            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-2 block font-semibold text-slate-700">
              Description
            </label>

            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Write a short description..."
              rows={4}
              className="w-full resize-none rounded-lg border border-slate-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="whitespace-pre-wrap rounded-lg bg-red-100 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex flex-wrap gap-4 pt-2">

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Expense"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/")}
              className="rounded-lg bg-slate-200 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-300"
            >
              Cancel
            </button>

          </div>

        </form>
      </div>
    </main>
  );
}
