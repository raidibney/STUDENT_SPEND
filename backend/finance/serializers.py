
from rest_framework import serializers
from .models import Expense, MonthlyBudget, CategoryBudget


class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = '__all__'


class MonthlyBudgetSerializer(serializers.ModelSerializer):
    class Meta:
        model = MonthlyBudget
        fields = '__all__'

    def validate_month(self, value):
        if value < 1 or value > 12:
            raise serializers.ValidationError(
                "Month must be between 1 and 12."
            )
        return value

    def validate_budget_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "Budget must be greater than zero."
            )
        return value


class CategoryBudgetSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategoryBudget
        fields = '__all__'

    def validate_month(self, value):
        if value < 1 or value > 12:
            raise serializers.ValidationError(
                "Month must be between 1 and 12."
            )
        return value

    def validate_budget_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "Budget must be greater than zero."
            )
        return value
