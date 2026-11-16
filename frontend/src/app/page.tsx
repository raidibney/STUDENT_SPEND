
"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";

interface Expense {
  id: number;
  title: string;
  amount: string;
  category: string;
  date: string;
  description: string;
}

interface Budget {
  id: number;
  year: number;
  month: number;
  budget_amount: string;
}

interface CategoryBudget {
  id: number;
  year: number;
  month: number;
  category: string;
  budget_amount: string;
}

const EXPENSE_API = "http://127.0.0.1:8000/api/expenses/";
const BUDGET_API = "http://127.0.0.1:8000/api/budgets/";
const CATEGORY_BUDGET_API =
  "http://127.0.0.1:8000/api/category-budgets/";

const categories = [
  { value: "food", label: "Food", icon: "🍔" },
  { value: "transport", label: "Transport", icon: "🚌" },
  { value: "education", label: "Education", icon: "📚" },
  { value: "shopping", label: "Shopping", icon: "🛍️" },
  { value: "bills", label: "Bills", icon: "💡" },
  { value: "entertainment", label: "Entertainment", icon: "🎬" },
  { value: "health", label: "Health", icon: "💊" },
  { value: "others", label: "Others", icon: "📦" },
];

export default function Home() {
  const categoryBudgetFormRef = useRef<HTMLDivElement>(null);

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudget[]>([]);

  const [budgetInput, setBudgetInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("food");
  const [categoryBudgetInput, setCategoryBudgetInput] = useState("");

  const [year, setYear] = useState(0);
  const [month, setMonth] = useState(0);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [categoryMessage, setCategoryMessage] = useState("");

  useEffect(() => {
    const today = new Date();
    setYear(today.getFullYear());
    setMonth(today.getMonth() + 1);
  }, []);

  async function loadDashboardData() {
    const [expenseResponse, budgetResponse, categoryResponse] =
      await Promise.all([
        fetch(EXPENSE_API),
        fetch(BUDGET_API),
        fetch(CATEGORY_BUDGET_API),
      ]);

    if (
      !expenseResponse.ok ||
      !budgetResponse.ok ||
      !categoryResponse.ok
    ) {
      throw new Error("Failed to fetch dashboard data.");
    }

    const expenseData: Expense[] = await expenseResponse.json();
    const budgetData: Budget[] = await budgetResponse.json();
    const categoryData: CategoryBudget[] = await categoryResponse.json();

    const monthlyExpenses = expenseData.filter((expense) => {
      const expenseDate = new Date(`${expense.date}T00:00:00`);

      return (
        expenseDate.getFullYear() === year &&
        expenseDate.getMonth() + 1 === month
      );
    });

    const currentBudget = budgetData.find(
      (item) => item.year === year && item.month === month
    );

    const currentCategoryBudgets = categoryData.filter(
      (item) => item.year === year && item.month === month
    );

    setExpenses(monthlyExpenses);
    setBudget(currentBudget || null);
    setBudgetInput(currentBudget?.budget_amount || "");
    setCategoryBudgets(currentCategoryBudgets);
  }

  useEffect(() => {
    if (!year || !month) return;

    async function fetchDashboardData() {
      setLoading(true);
      setError("");

      try {
        await loadDashboardData();
      } catch {
        setError("Could not connect to Django API. Please check your backend.");
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [year, month]);

  const totalExpenses = expenses.reduce(
    (total, expense) => total + Number(expense.amount),
    0
  );

  const monthlyBudget = Number(budget?.budget_amount || 0);
  const remainingBalance = monthlyBudget - totalExpenses;

  const spendingPercentage =
    monthlyBudget > 0 ? (totalExpenses / monthlyBudget) * 100 : 0;

  const monthName = month
    ? new Date(year, month - 1).toLocaleString("en-US", {
        month: "long",
      })
    : "";

  async function handleSaveBudget() {
    const amount = Number(budgetInput);

    if (!budgetInput || !Number.isFinite(amount) || amount <= 0) {
      setMessage("Please enter a valid budget greater than zero.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const budgetData = {
        year,
        month,
        budget_amount: amount.toFixed(2),
      };

      const response = await fetch(
        budget ? `${BUDGET_API}${budget.id}/` : BUDGET_API,
        {
          method: budget ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(budgetData),
        }
      );

      if (!response.ok) {
        throw new Error("Could not save budget.");
      }

      const savedBudget: Budget = await response.json();

      setBudget(savedBudget);
      setBudgetInput(savedBudget.budget_amount);
      setMessage("Monthly budget saved successfully!");
    } catch {
      setMessage("Failed to save budget. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveCategoryBudget() {
    const amount = Number(categoryBudgetInput);

    if (
      !categoryBudgetInput ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      setCategoryMessage("Enter a valid category budget greater than zero.");
      return;
    }

    setSavingCategory(true);
    setCategoryMessage("");

    try {
      const existingBudget = categoryBudgets.find(
        (item) => item.category === selectedCategory
      );

      const categoryData = {
        year,
        month,
        category: selectedCategory,
        budget_amount: amount.toFixed(2),
      };

      const response = await fetch(
        existingBudget
          ? `${CATEGORY_BUDGET_API}${existingBudget.id}/`
          : CATEGORY_BUDGET_API,
        {
          method: existingBudget ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(categoryData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
      }

      const savedCategoryBudget: CategoryBudget =
        await response.json();

      setCategoryBudgets((previous) => {
        const exists = previous.some(
          (item) => item.id === savedCategoryBudget.id
        );

        if (exists) {
          return previous.map((item) =>
            item.id === savedCategoryBudget.id
              ? savedCategoryBudget
              : item
          );
        }

        return [...previous, savedCategoryBudget];
      });

      setCategoryBudgetInput("");
      setCategoryMessage("Category budget saved successfully!");
    } catch (err) {
      setCategoryMessage(
        err instanceof Error
          ? `Failed to save: ${err.message}`
          : "Failed to save category budget."
      );
    } finally {
      setSavingCategory(false);
    }
  }

  function handleEditCategory(item: CategoryBudget) {
    setSelectedCategory(item.category);
    setCategoryBudgetInput(item.budget_amount);
    setCategoryMessage(
      `Editing ${
        categories.find(
          (category) => category.value === item.category
        )?.label || item.category
      } budget. Change the amount and click Update Category Budget.`
    );

    categoryBudgetFormRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }

  function getCategorySpending(category: string) {
    return expenses
      .filter((expense) => expense.category === category)
      .reduce((total, expense) => total + Number(expense.amount), 0);
  }

  function formatMoney(amount: number) {
    return `৳${amount.toLocaleString("en-IN")}`;
  }

  function getCategoryIcon(category: string) {
    return (
      categories.find((item) => item.value === category)?.icon || "📦"
    );
  }

  function getCategoryLabel(category: string) {
    return (
      categories.find((item) => item.value === category)?.label || category
    );
  }

  const recentExpenses = [...expenses]
    .sort(
      (a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    )
    .slice(0, 5);

  const categoryColors = [
    "bg-emerald-500",
    "bg-blue-500",
    "bg-amber-500",
    "bg-purple-500",
    "bg-rose-500",
    "bg-cyan-500",
    "bg-orange-500",
    "bg-indigo-500",
  ];

  return (
    <main className="min-h-screen bg-[#F5F7F6] text-[#24332F]">
      <div className="flex min-h-screen">

        {/* SIDEBAR */}
        <aside className="hidden w-[250px] shrink-0 flex-col border-r border-[#E7ECE9] bg-white px-5 py-7 lg:flex">
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#28594D] text-xl text-white shadow-sm">
              S
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-[#24332F]">
                StudentSpend
              </h1>
              <p className="text-xs text-[#8A9891]">Financial planner</p>
            </div>
          </div>

          <div className="mt-12">
            <p className="mb-4 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#9AA7A1]">
              Workspace
            </p>

            <nav className="space-y-2">
              <Link
                href="/"
                className="flex items-center gap-3 rounded-xl bg-[#E7F0EB] px-4 py-3 text-sm font-semibold text-[#28594D]"
              >
                <span>▦</span>
                Dashboard
              </Link>

              <Link
                href="/expenses"
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-[#71817B] transition hover:bg-[#F4F7F5] hover:text-[#28594D]"
              >
                <span>↗</span>
                Expenses
              </Link>

              <Link
                href="/expenses/new"
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-[#71817B] transition hover:bg-[#F4F7F5] hover:text-[#28594D]"
              >
                <span>＋</span>
                Add Expense
              </Link>

              <Link
                href="/analytics"
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-[#71817B] transition hover:bg-[#F4F7F5] hover:text-[#28594D]"
              >
                <span>◷</span>
                Analytics
              </Link>
            </nav>
          </div>

          <div className="mt-auto rounded-2xl bg-[#F0F5F2] p-4">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-lg">
              💡
            </div>
            <h3 className="text-sm font-bold text-[#28594D]">
              Smart spending tip
            </h3>
            <p className="mt-2 text-xs leading-5 text-[#71817B]">
              Track your expenses regularly to stay within your monthly budget.
            </p>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <div className="min-w-0 flex-1">

          {/* TOP BAR */}
          <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-4 border-b border-[#E7ECE9] bg-white/90 px-5 py-4 backdrop-blur-md sm:px-8 lg:px-10">
            <div>
              <p className="text-xs font-medium text-[#8A9891]">
                Student Financial Survival Planner
              </p>
              <h2 className="mt-1 text-lg font-bold text-[#24332F]">
                Dashboard
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-[#24332F]">
                  Personal Workspace
                </p>
                <p className="text-xs text-[#8A9891]">
                  {monthName} {year}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E4EFE9] font-bold text-[#28594D]">
                S
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-[1450px] space-y-7 p-5 sm:p-8 lg:p-10">

            {/* WELCOME SECTION */}
            <section className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
              <div>
                <p className="text-sm font-semibold text-[#54816F]">
                  YOUR FINANCIAL OVERVIEW
                </p>
                <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#24332F] sm:text-4xl">
                  Welcome to StudentSpend
                </h1>
                <p className="mt-2 text-sm text-[#71817B]">
                  Manage your money, track your spending, and stay on budget.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/analytics"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#DCE5DF] bg-white px-5 py-3 text-sm font-semibold text-[#28594D] shadow-sm transition hover:bg-[#F4F8F5]"
                >
                  <span>◷</span>
                  View Analytics
                </Link>

                <Link
                  href="/expenses/new"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#28594D] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1E483E]"
                >
                  <span className="text-lg">＋</span>
                  Add Expense
                </Link>
              </div>
            </section>

            {/* ERROR MESSAGE */}
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            {/* SUMMARY CARDS */}
            <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">

              <div className="rounded-2xl border border-[#E7ECE9] bg-white p-6 shadow-[0_3px_15px_rgba(35,65,55,0.035)]">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-[#71817B]">
                    Monthly Budget
                  </p>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E7F0EB] text-xl">
                    🎯
                  </div>
                </div>
                <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-[#28594D]">
                  {loading ? "Loading..." : formatMoney(monthlyBudget)}
                </h2>
                <p className="mt-2 text-xs text-[#9AA7A1]">
                  Your spending limit for this month
                </p>
              </div>

              <div className="rounded-2xl border border-[#E7ECE9] bg-white p-6 shadow-[0_3px_15px_rgba(35,65,55,0.035)]">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-[#71817B]">
                    Total Expenses
                  </p>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF0ED] text-xl">
                    💸
                  </div>
                </div>
                <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-[#D75B5B]">
                  {loading ? "Loading..." : formatMoney(totalExpenses)}
                </h2>
                <p className="mt-2 text-xs text-[#9AA7A1]">
                  Your total spending this month
                </p>
              </div>

              <div className="rounded-2xl border border-[#E7ECE9] bg-white p-6 shadow-[0_3px_15px_rgba(35,65,55,0.035)] md:col-span-2 xl:col-span-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-[#71817B]">
                    Remaining Balance
                  </p>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8F5ED] text-xl">
                    💰
                  </div>
                </div>
                <h2
                  className={`mt-5 text-3xl font-extrabold tracking-tight ${
                    remainingBalance >= 0 ? "text-[#26966D]" : "text-[#D75B5B]"
                  }`}
                >
                  {loading ? "Loading..." : formatMoney(remainingBalance)}
                </h2>
                <p className="mt-2 text-xs text-[#9AA7A1]">
                  {remainingBalance >= 0
                    ? "Amount left from your monthly budget"
                    : "You have exceeded your monthly budget"}
                </p>
              </div>
            </section>

            {/* BUDGET PLANNER + BUDGET USAGE */}
            <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">

              {/* MONTHLY BUDGET FORM */}
              <div className="rounded-2xl border border-[#E7ECE9] bg-white p-6 shadow-[0_3px_15px_rgba(35,65,55,0.035)] sm:p-7">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[#54816F]">
                      Planning
                    </p>
                    <h2 className="mt-2 text-xl font-bold text-[#24332F]">
                      Monthly Budget Planner
                    </h2>
                    <p className="mt-2 text-sm text-[#8A9891]">
                      Set your spending limit for {monthName} {year}.
                    </p>
                  </div>
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E7F0EB] text-xl">
                    📅
                  </div>
                </div>

                <label className="mt-7 block text-sm font-semibold text-[#43564E]">
                  Monthly budget amount
                </label>

                <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                  <div className="flex min-w-0 flex-1 items-center rounded-xl border border-[#DCE5DF] bg-[#FAFCFA] px-4 transition focus-within:border-[#54816F] focus-within:ring-2 focus-within:ring-[#E4EFE9]">
                    <span className="font-bold text-[#54816F]">৳</span>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={budgetInput}
                      onChange={(e) => setBudgetInput(e.target.value)}
                      placeholder="Enter monthly budget"
                      className="w-full bg-transparent p-3.5 text-sm outline-none"
                    />
                  </div>

                  <button
                    onClick={handleSaveBudget}
                    disabled={saving || loading}
                    className="rounded-xl bg-[#28594D] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#1E483E] disabled:opacity-50"
                  >
                    {saving
                      ? "Saving..."
                      : budget
                      ? "Update Budget"
                      : "Set Budget"}
                  </button>
                </div>

                {message && (
                  <p className="mt-4 rounded-lg bg-[#F0F5F2] px-4 py-3 text-sm font-medium text-[#28594D]">
                    {message}
                  </p>
                )}
              </div>

              {/* BUDGET USAGE */}
              <div className="rounded-2xl border border-[#E7ECE9] bg-white p-6 shadow-[0_3px_15px_rgba(35,65,55,0.035)] sm:p-7">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[#54816F]">
                      Spending progress
                    </p>
                    <h2 className="mt-2 text-xl font-bold text-[#24332F]">
                      Budget Usage
                    </h2>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EDF4FC] text-xl">
                    📊
                  </div>
                </div>

                {loading ? (
                  <p className="mt-8 text-sm text-[#8A9891]">
                    Loading budget...
                  </p>
                ) : monthlyBudget <= 0 ? (
                  <p className="mt-8 rounded-xl bg-[#F6F8F6] p-5 text-sm text-[#71817B]">
                    Set your monthly budget to see spending progress.
                  </p>
                ) : (
                  <>
                    <div className="mt-8 flex items-end justify-between gap-3">
                      <div>
                        <p className="text-sm text-[#8A9891]">Budget used</p>
                        <h3 className="mt-1 text-4xl font-extrabold text-[#24332F]">
                          {spendingPercentage.toFixed(1)}%
                        </h3>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                          spendingPercentage > 100
                            ? "bg-[#FFF0F0] text-[#D75B5B]"
                            : spendingPercentage >= 80
                            ? "bg-[#FFF5DF] text-[#B47A1E]"
                            : "bg-[#E6F5ED] text-[#26966D]"
                        }`}
                      >
                        {spendingPercentage > 100
                          ? "Over budget"
                          : spendingPercentage >= 80
                          ? "Almost there"
                          : "On track"}
                      </span>
                    </div>

                    <div className="mt-5 h-3.5 w-full overflow-hidden rounded-full bg-[#EDF1EE]">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          spendingPercentage > 100
                            ? "bg-[#D75B5B]"
                            : spendingPercentage >= 80
                            ? "bg-[#D99B35]"
                            : "bg-[#3C8A6C]"
                        }`}
                        style={{
                          width: `${Math.min(spendingPercentage, 100)}%`,
                        }}
                      />
                    </div>

                    <div className="mt-4 flex justify-between gap-3 text-xs text-[#8A9891]">
                      <span>{formatMoney(totalExpenses)} spent</span>
                      <span>{formatMoney(monthlyBudget)} budget</span>
                    </div>

                    <p
                      className={`mt-5 rounded-xl px-4 py-3 text-sm font-medium ${
                        spendingPercentage > 100
                          ? "bg-[#FFF0F0] text-[#C24E4E]"
                          : spendingPercentage >= 80
                          ? "bg-[#FFF5DF] text-[#A87522]"
                          : "bg-[#E6F5ED] text-[#267B5B]"
                      }`}
                    >
                      {spendingPercentage > 100
                        ? "Warning! You have exceeded your monthly budget."
                        : spendingPercentage >= 80
                        ? "Careful! You have used at least 80% of your budget."
                        : "You are within your monthly budget."}
                    </p>
                  </>
                )}
              </div>
            </section>

            {/* CATEGORY BUDGET PLANNER */}
            <section className="rounded-2xl border border-[#E7ECE9] bg-white p-6 shadow-[0_3px_15px_rgba(35,65,55,0.035)] sm:p-8">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#54816F]">
                    Expense management
                  </p>
                  <h2 className="mt-2 text-xl font-bold text-[#24332F]">
                    Category-wise Budget Planner
                  </h2>
                  <p className="mt-2 text-sm text-[#8A9891]">
                    Set and manage a separate budget for each spending category.
                  </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F1ECFC] text-xl">
                  🗂️
                </div>
              </div>

              {/* CATEGORY FORM */}
              <div
                ref={categoryBudgetFormRef}
                className="mt-7 grid scroll-mt-24 gap-4 rounded-xl bg-[#F7F9F7] p-4 sm:p-5 md:grid-cols-3"
              >
                <div>
                  <label className="mb-2 block text-xs font-semibold text-[#71817B]">
                    Select category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full rounded-xl border border-[#DCE5DF] bg-white p-3.5 text-sm text-[#24332F] outline-none focus:border-[#54816F]"
                  >
                    {categories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-[#71817B]">
                    Budget amount
                  </label>
                  <div className="flex items-center rounded-xl border border-[#DCE5DF] bg-white px-3">
                    <span className="font-semibold text-[#54816F]">৳</span>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={categoryBudgetInput}
                      onChange={(e) => setCategoryBudgetInput(e.target.value)}
                      placeholder="Enter category budget"
                      className="w-full bg-transparent p-3 text-sm outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col justify-end">
                  <button
                    onClick={handleSaveCategoryBudget}
                    disabled={savingCategory || loading}
                    className="w-full rounded-xl bg-[#28594D] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#1E483E] disabled:opacity-50"
                  >
                    {savingCategory
                      ? "Saving..."
                      : categoryBudgets.some(
                          (item) => item.category === selectedCategory
                        )
                      ? "Update Category Budget"
                      : "Save Category Budget"}
                  </button>
                </div>
              </div>

              {categoryMessage && (
                <p className="mt-4 rounded-xl bg-[#F0F5F2] px-4 py-3 text-sm font-medium text-[#28594D]">
                  {categoryMessage}
                </p>
              )}

              {/* CATEGORY OVERVIEW */}
              <div className="mt-9">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-[#24332F]">
                      Category Spending Overview
                    </h3>
                    <p className="mt-1 text-xs text-[#9AA7A1]">
                      Your spending limits by category
                    </p>
                  </div>
                  <span className="rounded-full bg-[#F0F5F2] px-3 py-1.5 text-xs font-semibold text-[#54816F]">
                    {categoryBudgets.length} categories
                  </span>
                </div>

                {loading ? (
                  <p className="text-sm text-[#8A9891]">
                    Loading categories...
                  </p>
                ) : categoryBudgets.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[#DCE5DF] bg-[#FAFCFA] p-8 text-center">
                    <div className="text-3xl">📊</div>
                    <p className="mt-3 font-semibold text-[#43564E]">
                      No category budgets yet
                    </p>
                    <p className="mt-1 text-sm text-[#8A9891]">
                      Set your first category budget using the form above.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 lg:grid-cols-2">
                    {categoryBudgets.map((item) => {
                      const spent = getCategorySpending(item.category);
                      const limit = Number(item.budget_amount);
                      const remaining = limit - spent;
                      const percentage = (spent / limit) * 100;

                      const categoryName = getCategoryLabel(item.category);

                      return (
                        <div
                          key={item.id}
                          className="rounded-xl border border-[#E7ECE9] bg-white p-5 transition hover:border-[#CBDDD2] hover:shadow-sm"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F0F5F2] text-xl">
                                {getCategoryIcon(item.category)}
                              </div>
                              <div>
                                <h4 className="font-bold text-[#24332F]">
                                  {categoryName}
                                </h4>
                                <p className="mt-0.5 text-xs text-[#8A9891]">
                                  Budget: {formatMoney(limit)}
                                </p>
                              </div>
                            </div>

                            <button
                              onClick={() => handleEditCategory(item)}
                              className="rounded-lg border border-[#DCE5DF] px-3 py-2 text-xs font-semibold text-[#28594D] transition hover:bg-[#E7F0EB]"
                            >
                              Edit Budget
                            </button>
                          </div>

                          <div className="mt-6 grid grid-cols-3 gap-2">
                            <div>
                              <p className="text-xs text-[#9AA7A1]">Spent</p>
                              <p className="mt-1 text-sm font-bold text-[#D75B5B]">
                                {formatMoney(spent)}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-[#9AA7A1]">
                                Remaining
                              </p>
                              <p
                                className={`mt-1 text-sm font-bold ${
                                  remaining >= 0
                                    ? "text-[#26966D]"
                                    : "text-[#D75B5B]"
                                }`}
                              >
                                {formatMoney(remaining)}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-[#9AA7A1]">Used</p>
                              <p className="mt-1 text-sm font-bold text-[#24332F]">
                                {percentage.toFixed(1)}%
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-[#EDF1EE]">
                            <div
                              className={`h-full rounded-full transition-all ${
                                percentage > 100
                                  ? "bg-[#D75B5B]"
                                  : percentage >= 80
                                  ? "bg-[#D99B35]"
                                  : categoryColors[
                                      categories.findIndex(
                                        (category) =>
                                          category.value === item.category
                                      ) % categoryColors.length
                                    ]
                              }`}
                              style={{
                                width: `${Math.min(percentage, 100)}%`,
                              }}
                            />
                          </div>

                          <p
                            className={`mt-3 text-xs font-medium ${
                              percentage > 100
                                ? "text-[#D75B5B]"
                                : percentage >= 80
                                ? "text-[#B47A1E]"
                                : "text-[#26966D]"
                            }`}
                          >
                            {percentage > 100
                              ? "Warning! Category budget exceeded."
                              : percentage >= 80
                              ? "Careful! You are close to your category limit."
                              : "Within category budget."}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            {/* RECENT EXPENSES */}
            <section className="rounded-2xl border border-[#E7ECE9] bg-white p-6 shadow-[0_3px_15px_rgba(35,65,55,0.035)] sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#54816F]">
                    Transaction history
                  </p>
                  <h2 className="mt-2 text-xl font-bold text-[#24332F]">
                    Recent Expenses
                  </h2>
                  <p className="mt-1 text-sm text-[#8A9891]">
                    Your latest spending activity for this month
                  </p>
                </div>

                <Link
                  href="/expenses"
                  className="rounded-xl border border-[#DCE5DF] px-4 py-2.5 text-sm font-semibold text-[#28594D] transition hover:bg-[#F4F8F5]"
                >
                  View All →
                </Link>
              </div>

              {loading && (
                <p className="mt-6 text-sm text-[#8A9891]">
                  Loading expenses...
                </p>
              )}

              {!loading && expenses.length === 0 && (
                <div className="mt-6 rounded-xl border border-dashed border-[#DCE5DF] bg-[#FAFCFA] p-8 text-center">
                  <div className="text-3xl">🧾</div>
                  <p className="mt-3 font-semibold text-[#43564E]">
                    No expenses found
                  </p>
                  <p className="mt-1 text-sm text-[#8A9891]">
                    Add your first expense to start tracking your money.
                  </p>
                  <Link
                    href="/expenses/new"
                    className="mt-4 inline-flex rounded-xl bg-[#28594D] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1E483E]"
                  >
                    + Add Expense
                  </Link>
                </div>
              )}

              {!loading && recentExpenses.length > 0 && (
                <div className="mt-6 overflow-x-auto">
                  <table className="w-full min-w-[600px] text-left">
                    <thead>
                      <tr className="border-b border-[#E7ECE9] text-xs uppercase tracking-wider text-[#9AA7A1]">
                        <th className="pb-4 font-semibold">Expense</th>
                        <th className="pb-4 font-semibold">Category</th>
                        <th className="pb-4 font-semibold">Date</th>
                        <th className="pb-4 text-right font-semibold">
                          Amount
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {recentExpenses.map((expense) => (
                        <tr
                          key={expense.id}
                          className="border-b border-[#F0F3F1] last:border-0"
                        >
                          <td className="py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F0F5F2] text-lg">
                                {getCategoryIcon(expense.category)}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-[#24332F]">
                                  {expense.title}
                                </p>
                                <p className="mt-0.5 text-xs text-[#9AA7A1]">
                                  {expense.description || "No description"}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="py-4">
                            <span className="rounded-full bg-[#F0F5F2] px-3 py-1.5 text-xs font-semibold text-[#54816F]">
                              {getCategoryLabel(expense.category)}
                            </span>
                          </td>

                          <td className="py-4 text-sm text-[#71817B]">
                            {expense.date}
                          </td>

                          <td className="py-4 text-right text-sm font-bold text-[#D75B5B]">
                            -{formatMoney(Number(expense.amount))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* FOOTER - FIXED */}
            <footer className="pb-3 pt-2 text-center text-xs text-[#9AA7A1]">
              StudentSpend © {year || "2026"} · Your money, managed smarter.
            </footer>

          </div>
        </div>
      </div>
    </main>
  );
}
