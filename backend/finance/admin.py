
from django.contrib import admin
from .models import Expense, MonthlyBudget, CategoryBudget


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ('title', 'amount', 'category', 'date')
    list_filter = ('category', 'date')
    search_fields = ('title', 'description')
    ordering = ('-date',)


@admin.register(MonthlyBudget)
class MonthlyBudgetAdmin(admin.ModelAdmin):
    list_display = ('year', 'month', 'budget_amount')
    list_filter = ('year', 'month')
    ordering = ('-year', '-month')


@admin.register(CategoryBudget)
class CategoryBudgetAdmin(admin.ModelAdmin):
    list_display = ('year', 'month', 'category', 'budget_amount')
    list_filter = ('year', 'month', 'category')
    ordering = ('-year', '-month')
