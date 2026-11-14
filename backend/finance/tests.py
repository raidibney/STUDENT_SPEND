
from datetime import date

from django.test import TestCase
from rest_framework.test import APIClient

from .models import Expense, MonthlyBudget, CategoryBudget


class ExpenseModelTest(TestCase):

    def test_create_expense(self):
        expense = Expense.objects.create(
            title="University Lunch",
            amount=250,
            category="food",
            date=date(2026, 11, 10)
        )

        self.assertEqual(expense.title, "University Lunch")
        self.assertEqual(float(expense.amount), 250.0)
        self.assertEqual(expense.category, "food")


class BudgetModelTest(TestCase):

    def test_create_monthly_budget(self):
        budget = MonthlyBudget.objects.create(
            year=2026,
            month=11,
            budget_amount=20000
        )

        self.assertEqual(budget.month, 11)
        self.assertEqual(float(budget.budget_amount), 20000.0)

    def test_create_category_budget(self):
        budget = CategoryBudget.objects.create(
            year=2026,
            month=11,
            category="food",
            budget_amount=5000
        )

        self.assertEqual(budget.category, "food")


class ExpenseAPITest(TestCase):

    def setUp(self):
        self.client = APIClient()

    def test_add_expense_api(self):
        response = self.client.post(
            "/api/expenses/",
            {
                "title": "Transport",
                "amount": "100.00",
                "category": "transport",
                "date": "2026-11-10",
                "description": "University bus"
            },
            format="json"
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(Expense.objects.count(), 1)

    def test_get_expenses_api(self):
        response = self.client.get("/api/expenses/")

        self.assertEqual(response.status_code, 200)
