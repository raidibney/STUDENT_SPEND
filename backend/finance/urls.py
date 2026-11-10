
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    ExpenseViewSet,
    MonthlyBudgetViewSet,
    CategoryBudgetViewSet,
    AnalyticsView,
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
    path('', include(router.urls)),
]
