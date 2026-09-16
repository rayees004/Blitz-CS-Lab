from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'user_type', 'is_staff', 'is_active')
    list_filter = ('user_type', 'is_staff', 'is_superuser', 'is_active')
    fieldsets = UserAdmin.fieldsets + (
        ('Platform Details', {'fields': ('user_type', 'phone_number', 'organization')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Platform Details', {'fields': ('user_type', 'phone_number', 'organization')}),
    )
