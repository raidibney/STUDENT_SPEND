
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    ExpenseViewSet,
    MonthlyBudgetViewSet,
    CategoryBudgetViewSet,
    AnalyticsView,
    ExportExpensesJSONView,
    ImportExpensesJSONView,
    ExportExpensesCSVView,
    ImportExpensesCSVView,
)

router = DefaultRouter()

router.register(r'expenses', ExpenseViewSet, basename='expense')
router.register(r'budgets', MonthlyBudgetViewSet, basename='budget')
router.register(
    r'category-budgets',
    CategoryBudgetViewSet,
    basename='category-budget'
)

urlpatterns = [
    path('analytics/', AnalyticsView.as_view(), name='analytics'),

    path(
        'expenses/export/json/',
        ExportExpensesJSONView.as_view(),
        name='export-expenses-json'
    ),
    path(
        'expenses/import/json/',
        ImportExpensesJSONView.as_view(),
        name='import-expenses-json'
    ),
    path(
        'expenses/export/csv/',
        ExportExpensesCSVView.as_view(),
        name='export-expenses-csv'
    ),
    path(
        'expenses/import/csv/',
        ImportExpensesCSVView.as_view(),
        name='import-expenses-csv'
    ),

    path('', include(router.urls)),
]
