
import calendar
import numpy as np

from datetime import date

from django.utils import timezone
from django.db.models import Sum

from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import Expense, MonthlyBudget, CategoryBudget
from .serializers import (
    ExpenseSerializer,
    MonthlyBudgetSerializer,
    CategoryBudgetSerializer,
)


class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all().order_by('-date')
    serializer_class = ExpenseSerializer


class MonthlyBudgetViewSet(viewsets.ModelViewSet):
    queryset = MonthlyBudget.objects.all()
    serializer_class = MonthlyBudgetSerializer


class CategoryBudgetViewSet(viewsets.ModelViewSet):
    queryset = CategoryBudget.objects.all()
    serializer_class = CategoryBudgetSerializer


class AnalyticsView(APIView):

    def get(self, request):

        # Get selected year and month.
        today = timezone.localdate()

        try:
            year = int(request.query_params.get('year', today.year))
            month = int(request.query_params.get('month', today.month))

            if year < 1 or month < 1 or month > 12:
                raise ValueError

        except (ValueError, TypeError):
            return Response(
                {"error": "Please provide a valid year and month."},
                status=400
            )

        # Calculate the selected month's date range.
        start_date = date(year, month, 1)
        total_days = calendar.monthrange(year, month)[1]
        end_date = date(year, month, total_days)

        # Fetch expenses for the selected month.
        expenses = Expense.objects.filter(
            date__range=(start_date, end_date)
        )

        amounts = np.array(
            [float(expense.amount) for expense in expenses],
            dtype=float
        )

        total_expenses = float(np.sum(amounts))
        expense_count = len(amounts)

        # Calculate average daily expenses.
        if year == today.year and month == today.month:
            elapsed_days = today.day
        elif end_date < today:
            elapsed_days = total_days
        else:
            elapsed_days = 0

        average_daily_expense = (
            total_expenses / elapsed_days
            if elapsed_days > 0 else 0
        )

        # Predict spending by the end of the month.
        projected_spending = (
            average_daily_expense * total_days
            if elapsed_days > 0 else 0
        )

        # Category-wise spending.
        category_breakdown = []

        for category_code, category_name in Expense.CATEGORY_CHOICES:

            category_amounts = np.array(
                [
                    float(expense.amount)
                    for expense in expenses
                    if expense.category == category_code
                ],
                dtype=float
            )

            category_total = float(np.sum(category_amounts))

            percentage = (
                (category_total / total_expenses) * 100
                if total_expenses > 0 else 0
            )

            category_budget = CategoryBudget.objects.filter(
                year=year,
                month=month,
                category=category_code
            ).first()

            budget_amount = (
                float(category_budget.budget_amount)
                if category_budget else 0
            )

            category_breakdown.append({
                "category": category_code,
                "category_name": category_name,
                "spent": round(category_total, 2),
                "percentage": round(percentage, 2),
                "budget": round(budget_amount, 2),
                "remaining": round(budget_amount - category_total, 2),
            })

        # Find the highest spending category.
        if category_breakdown:
            highest_category = max(
                category_breakdown,
                key=lambda item: item["spent"]
            )
        else:
            highest_category = None

        # Get monthly budget.
        monthly_budget = MonthlyBudget.objects.filter(
            year=year,
            month=month
        ).first()

        budget_amount = (
            float(monthly_budget.budget_amount)
            if monthly_budget else 0
        )

        # Calculate last six months' spending.
        monthly_trend = []

        for offset in range(5, -1, -1):

            month_index = year * 12 + month - 1 - offset
            trend_year = month_index // 12
            trend_month = month_index % 12 + 1

            trend_start = date(trend_year, trend_month, 1)
            trend_end = date(
                trend_year,
                trend_month,
                calendar.monthrange(trend_year, trend_month)[1]
            )

            trend_expenses = Expense.objects.filter(
                date__range=(trend_start, trend_end)
            )

            trend_amounts = np.array(
                [float(item.amount) for item in trend_expenses],
                dtype=float
            )

            monthly_trend.append({
                "year": trend_year,
                "month": trend_month,
                "month_name": calendar.month_abbr[trend_month],
                "total": round(float(np.sum(trend_amounts)), 2),
            })

        # NumPy calculates the average monthly spending.
        trend_values = np.array(
            [item["total"] for item in monthly_trend],
            dtype=float
        )

        average_monthly_spending = (
            float(np.mean(trend_values))
            if len(trend_values) > 0 else 0
        )

        return Response({
            "year": year,
            "month": month,
            "month_name": calendar.month_name[month],

            "total_expenses": round(total_expenses, 2),
            "expense_count": expense_count,
            "average_daily_expense": round(average_daily_expense, 2),
            "projected_monthly_spending": round(projected_spending, 2),

            "monthly_budget": round(budget_amount, 2),
            "remaining_balance": round(
                budget_amount - total_expenses, 2
            ),

            "highest_category": highest_category,
            "category_breakdown": category_breakdown,

            "monthly_trend": monthly_trend,
            "average_monthly_spending": round(
                average_monthly_spending, 2
            ),
        })
