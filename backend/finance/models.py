
from django.db import models


class Expense(models.Model):

    CATEGORY_CHOICES = [
        ('food', 'Food'),
        ('transport', 'Transport'),
        ('education', 'Education'),
        ('shopping', 'Shopping'),
        ('bills', 'Bills'),
        ('entertainment', 'Entertainment'),
        ('health', 'Health'),
        ('others', 'Others'),
    ]

    title = models.CharField(max_length=150)

    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    category = models.CharField(
        max_length=20,
        choices=CATEGORY_CHOICES,
        default='others'
    )

    date = models.DateField()

    description = models.TextField(
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - ৳{self.amount}"


class MonthlyBudget(models.Model):

    year = models.PositiveIntegerField()

    month = models.PositiveIntegerField()

    budget_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['year', 'month'],
                name='unique_monthly_budget'
            )
        ]
        ordering = ['-year', '-month']

    def __str__(self):
        return f"{self.year}-{self.month}: ৳{self.budget_amount}"

    
class CategoryBudget(models.Model):

    CATEGORY_CHOICES = [
        ('food', 'Food'),
        ('transport', 'Transport'),
        ('education', 'Education'),
        ('shopping', 'Shopping'),
        ('bills', 'Bills'),
        ('entertainment', 'Entertainment'),
        ('health', 'Health'),
        ('others', 'Others'),
    ]

    year = models.PositiveIntegerField()

    month = models.PositiveIntegerField()

    category = models.CharField(
        max_length=20,
        choices=CATEGORY_CHOICES
    )

    budget_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['year', 'month', 'category'],
                name='unique_monthly_category_budget'
            )
        ]
        ordering = ['category']

    def __str__(self):
        return f"{self.category} - {self.year}/{self.month}: ৳{self.budget_amount}"

