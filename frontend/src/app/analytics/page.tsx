
"use client";

import { useEffect, useState } from "react";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";

const API = "http://127.0.0.1:8000/api/analytics/";

interface CategoryData {
  category: string;
  category_name: string;
  spent: number;
  percentage: number;
  budget: number;
  remaining: number;
}

interface MonthlyTrend {
  year: number;
  month: number;
  month_name: string;
  total: number;
}

interface AnalyticsData {
  year: number;
  month: number;
  month_name: string;
  total_expenses: number;
  expense_count: number;
  average_daily_expense: number;
  projected_monthly_spending: number;
  monthly_budget: number;
  remaining_balance: number;
  highest_category: CategoryData | null;
  category_breakdown: CategoryData[];
  monthly_trend: MonthlyTrend[];
  average_monthly_spending: number;
}

const COLORS = [
  "#2563eb",
  "#16a34a",
  "#f59e0b",
  "#9333ea",
  "#ef4444",
  "#0891b2",
  "#db2777",
  "#64748b",
];

const money = (amount: number) =>
  `৳${Number(amount || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

export default function AnalyticsPage() {
  const [year, setYear] = useState<number | null>(null);
  const [month, setMonth] = useState<number | null>(null);

  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Set current local month after the component loads.
  useEffect(() => {
    const now = new Date();
    setYear(now.getFullYear());
    setMonth(now.getMonth() + 1);
  }, []);

  // Fetch analytics whenever selected month changes.
  useEffect(() => {
    if (year === null || month === null) return;

    async function fetchAnalytics() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API}?year=${year}&month=${month}`
        );

        if (!response.ok) {
          throw new Error("Could not fetch analytics data.");
        }

        const data: AnalyticsData = await response.json();
        setAnalytics(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [year, month]);

  const categoryData =
    analytics?.category_breakdown.filter(
      (item) => item.spent > 0
    ) || [];

  const trendData =
    analytics?.monthly_trend.map((item) => ({
      ...item,
      label: `${item.month_name} ${item.year}`,
    })) || [];

  const budgetUsage =
    analytics && analytics.monthly_budget > 0
      ? (analytics.total_expenses / analytics.monthly_budget) * 100
      : 0;

  return (
    <main className="min-h-screen bg-slate-100 p-6 md:p-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Analytics Dashboard
            </h1>

            <p className="mt-2 text-slate-500">
              Understand your spending and improve your financial habits.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href="/"
              className="rounded-lg border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Dashboard
            </a>

            <a
              href="/expenses"
              className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
            >
              Expense List
            </a>
          </div>
        </div>

        {/* Month Selector */}
        <section className="mt-8 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-slate-800">
            Select Analysis Period
          </h2>

          <div className="flex flex-wrap gap-4">
            <select
              value={month ?? ""}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="rounded-lg border border-slate-300 p-3"
            >
              {Array.from({ length: 12 }, (_, index) => (
                <option key={index + 1} value={index + 1}>
                  {new Date(2026, index).toLocaleString("en", {
                    month: "long",
                  })}
                </option>
              ))}
            </select>

            <select
              value={year ?? ""}
              onChange={(e) => setYear(Number(e.target.value))}
              className="rounded-lg border border-slate-300 p-3"
            >
              {Array.from({ length: 7 }, (_, index) => {
                const selectedYear = 2024 + index;

                return (
                  <option key={selectedYear} value={selectedYear}>
                    {selectedYear}
                  </option>
                );
              })}
            </select>
          </div>
        </section>

        {loading && (
          <div className="mt-8 rounded-xl bg-white p-10 text-center shadow-sm">
            <p className="text-lg text-slate-500">
              Loading analytics...
            </p>
          </div>
        )}

        {error && (
          <div className="mt-8 rounded-xl bg-red-50 p-6 text-red-600">
            {error}
          </div>
        )}

        {!loading && !error && analytics && (
          <>
            {/* Summary Cards */}
            <section className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">

              <div className="rounded-xl bg-white p-6 shadow-sm">
                <p className="text-slate-500">Total Expenses</p>
                <h2 className="mt-3 text-3xl font-bold text-red-600">
                  {money(analytics.total_expenses)}
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                  {analytics.expense_count} expense records
                </p>
              </div>

              <div className="rounded-xl bg-white p-6 shadow-sm">
                <p className="text-slate-500">Average Daily Spending</p>
                <h2 className="mt-3 text-3xl font-bold text-blue-600">
                  {money(analytics.average_daily_expense)}
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                  Per elapsed calendar day
                </p>
              </div>

              <div className="rounded-xl bg-white p-6 shadow-sm">
                <p className="text-slate-500">Projected Spending</p>
                <h2 className="mt-3 text-3xl font-bold text-purple-600">
                  {money(analytics.projected_monthly_spending)}
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                  Estimated month-end total
                </p>
              </div>

              <div className="rounded-xl bg-white p-6 shadow-sm">
                <p className="text-slate-500">Highest Category</p>
                <h2 className="mt-3 text-2xl font-bold text-orange-600">
                  {analytics.highest_category?.category_name || "None"}
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                  {money(analytics.highest_category?.spent || 0)}
                </p>
              </div>

            </section>

            {/* Budget Overview */}
            <section className="mt-8 rounded-xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-800">
                Monthly Budget Overview
              </h2>

              <div className="mt-5 grid gap-5 md:grid-cols-3">
                <div>
                  <p className="text-slate-500">Monthly Budget</p>
                  <h3 className="mt-2 text-2xl font-bold">
                    {money(analytics.monthly_budget)}
                  </h3>
                </div>

                <div>
                  <p className="text-slate-500">Remaining Balance</p>
                  <h3
                    className={`mt-2 text-2xl font-bold ${
                      analytics.remaining_balance >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {money(analytics.remaining_balance)}
                  </h3>
                </div>

                <div>
                  <p className="text-slate-500">Budget Used</p>
                  <h3 className="mt-2 text-2xl font-bold">
                    {budgetUsage.toFixed(1)}%
                  </h3>
                </div>
              </div>

              <div className="mt-5 h-4 overflow-hidden rounded-full bg-slate-200">
                <div
                  className={`h-full rounded-full ${
                    budgetUsage > 100 ? "bg-red-500" : "bg-blue-600"
                  }`}
                  style={{
                    width: `${Math.min(budgetUsage, 100)}%`,
                  }}
                />
              </div>

              <p
                className={`mt-4 font-medium ${
                  analytics.remaining_balance >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {analytics.monthly_budget === 0
                  ? "No monthly budget has been set."
                  : analytics.remaining_balance >= 0
                    ? "You are within your monthly budget."
                    : "Warning! You have exceeded your monthly budget."}
              </p>
            </section>

            {/* Charts */}
            <section className="mt-8 grid gap-6 lg:grid-cols-2">

              {/* Category Pie Chart */}
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <h2 className="text-xl font-bold text-slate-800">
                  Category-wise Spending
                </h2>

                {categoryData.length === 0 ? (
                  <p className="py-16 text-center text-slate-400">
                    No category spending data available.
                  </p>
                ) : (
                  <div className="mt-5 h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          dataKey="spent"
                          nameKey="category_name"
                          cx="50%"
                          cy="50%"
                          outerRadius={105}
                          label={({ name, percent }) =>
                            `${name} ${((percent || 0) * 100).toFixed(0)}%`
                          }
                        >
                          {categoryData.map((item, index) => (
                            <Cell
                              key={item.category}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>

                        <Tooltip
                          formatter={(value) => money(Number(value))}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Monthly Trend Chart */}
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <h2 className="text-xl font-bold text-slate-800">
                  Six-Month Spending Trend
                </h2>

                <div className="mt-5 h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />

                      <XAxis dataKey="label" />

                      <YAxis />

                      <Tooltip
                        formatter={(value) => money(Number(value))}
                      />

                      <Legend />

                      <Line
                        type="monotone"
                        dataKey="total"
                        name="Monthly Spending"
                        stroke="#2563eb"
                        strokeWidth={3}
                        dot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Category Comparison */}
              <div className="rounded-xl bg-white p-6 shadow-sm lg:col-span-2">
                <h2 className="text-xl font-bold text-slate-800">
                  Category Spending Comparison
                </h2>

                <div className="mt-5 h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData}>
                      <CartesianGrid strokeDasharray="3 3" />

                      <XAxis dataKey="category_name" />

                      <YAxis />

                      <Tooltip
                        formatter={(value) => money(Number(value))}
                      />

                      <Legend />

                      <Bar
                        dataKey="spent"
                        name="Actual Spending"
                        fill="#2563eb"
                        radius={[6, 6, 0, 0]}
                      />

                      <Bar
                        dataKey="budget"
                        name="Category Budget"
                        fill="#16a34a"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </section>

            {/* Category Details */}
            <section className="mt-8 rounded-xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-800">
                Category Spending Details
              </h2>

              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[650px] text-left">
                  <thead>
                    <tr className="border-b bg-slate-50 text-slate-600">
                      <th className="p-4">Category</th>
                      <th className="p-4">Spent</th>
                      <th className="p-4">Budget</th>
                      <th className="p-4">Remaining</th>
                      <th className="p-4">Used</th>
                    </tr>
                  </thead>

                  <tbody>
                    {analytics.category_breakdown.map((item) => (
                      <tr
                        key={item.category}
                        className="border-b last:border-0"
                      >
                        <td className="p-4 font-semibold">
                          {item.category_name}
                        </td>

                        <td className="p-4 text-red-600">
                          {money(item.spent)}
                        </td>

                        <td className="p-4">
                          {money(item.budget)}
                        </td>

                        <td
                          className={`p-4 font-semibold ${
                            item.remaining >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {money(item.remaining)}
                        </td>

                        <td className="p-4">
                          {item.budget > 0
                            ? `${(
                                (item.spent / item.budget) * 100
                              ).toFixed(1)}%`
                            : "No budget"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Average Monthly Spending */}
            <section className="mt-8 rounded-xl bg-blue-50 p-6">
              <h2 className="text-lg font-bold text-blue-900">
                Financial Insight
              </h2>

              <p className="mt-2 text-blue-800">
                Your average monthly spending over the last six months is{" "}
                <strong>
                  {money(analytics.average_monthly_spending)}
                </strong>.
              </p>

              <p className="mt-2 text-sm text-blue-700">
                Use this information to plan your future monthly budget
                and control unnecessary expenses.
              </p>
            </section>
          </>
        )}

      </div>
    </main>
  );
}
