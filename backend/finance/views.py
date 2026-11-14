
import calendar
import csv
import io
import json
import numpy as np

from datetime import date

from django.utils import timezone
from django.db.models import Sum
from django.db import transaction
from django.http import HttpResponse

from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser

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
        if total_expenses > 0:
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


# ==========================================
# JSON EXPORT
# ==========================================

class ExportExpensesJSONView(APIView):

    def get(self, request):

        expenses = Expense.objects.all().order_by('-date')
        serializer = ExpenseSerializer(expenses, many=True)

        response = HttpResponse(
            json.dumps(serializer.data, indent=4),
            content_type='application/json'
        )

        response['Content-Disposition'] = (
            'attachment; filename="studentspend_expenses.json"'
        )

        return response


# ==========================================
# JSON IMPORT
# ==========================================

class ImportExpensesJSONView(APIView):

    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):

        uploaded_file = request.FILES.get('file')

        if not uploaded_file:
            return Response(
                {"error": "Please upload a JSON file using the 'file' field."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not uploaded_file.name.lower().endswith('.json'):
            return Response(
                {"error": "Only JSON files are allowed."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:

            content = uploaded_file.read().decode('utf-8-sig')
            records = json.loads(content)

            if not isinstance(records, list):
                raise ValueError(
                    "JSON must contain a list of expenses."
                )

            if not records:
                raise ValueError(
                    "The JSON file contains no expenses."
                )

            serializers_list = []

            for index, record in enumerate(records, start=1):

                if not isinstance(record, dict):
                    raise ValueError(
                        f"Invalid expense record at row {index}."
                    )

                serializer = ExpenseSerializer(data=record)

                if not serializer.is_valid():
                    return Response(
                        {
                            "error": f"Invalid data at row {index}.",
                            "details": serializer.errors
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

                serializers_list.append(serializer)

            with transaction.atomic():

                for serializer in serializers_list:
                    serializer.save()

            return Response(
                {
                    "message": "JSON import successful!",
                    "imported_records": len(serializers_list)
                },
                status=status.HTTP_201_CREATED
            )

        except (
            UnicodeDecodeError,
            json.JSONDecodeError,
            ValueError
        ) as error:

            return Response(
                {"error": str(error)},
                status=status.HTTP_400_BAD_REQUEST
            )


# ==========================================
# CSV EXPORT
# ==========================================

class ExportExpensesCSVView(APIView):

    def get(self, request):

        expenses = Expense.objects.all().order_by('-date')

        response = HttpResponse(
            content_type='text/csv; charset=utf-8'
        )

        response.write('\ufeff')

        response['Content-Disposition'] = (
            'attachment; filename="studentspend_expenses.csv"'
        )

        writer = csv.writer(response)

        writer.writerow([
            'title',
            'amount',
            'category',
            'date',
            'description'
        ])

        for expense in expenses:

            writer.writerow([
                expense.title,
                expense.amount,
                expense.category,
                expense.date,
                expense.description or ''
            ])

        return response


# ==========================================
# CSV IMPORT
# ==========================================

class ImportExpensesCSVView(APIView):

    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):

        uploaded_file = request.FILES.get('file')

        if not uploaded_file:
            return Response(
                {"error": "Please upload a CSV file using the 'file' field."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not uploaded_file.name.lower().endswith('.csv'):
            return Response(
                {"error": "Only CSV files are allowed."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:

            content = uploaded_file.read().decode('utf-8-sig')
            reader = csv.DictReader(io.StringIO(content))

            required_columns = {
                'title',
                'amount',
                'category',
                'date',
                'description'
            }

            if not reader.fieldnames or not required_columns.issubset(
                set(reader.fieldnames)
            ):
                raise ValueError(
                    "CSV file has missing or incorrect columns."
                )

            serializers_list = []

            for index, record in enumerate(reader, start=1):

                serializer = ExpenseSerializer(data=record)

                if not serializer.is_valid():
                    return Response(
                        {
                            "error": f"Invalid data at row {index}.",
                            "details": serializer.errors
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

                serializers_list.append(serializer)

            if not serializers_list:
                raise ValueError(
                    "The CSV file contains no expenses."
                )

            with transaction.atomic():

                for serializer in serializers_list:
                    serializer.save()

            return Response(
                {
                    "message": "CSV import successful!",
                    "imported_records": len(serializers_list)
                },
                status=status.HTTP_201_CREATED
            )

        except (
            UnicodeDecodeError,
            csv.Error,
            ValueError
        ) as error:

            return Response(
                {"error": str(error)},
                status=status.HTTP_400_BAD_REQUEST
            )
