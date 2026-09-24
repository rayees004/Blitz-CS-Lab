from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, AuditLog


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


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'actor_username', 'action_type', 'target_entity', 'target_name', 'severity', 'ip_address')
    list_filter = ('action_type', 'severity', 'target_entity', 'timestamp')
    search_fields = ('actor_username', 'description', 'target_name', 'ip_address')
    readonly_fields = [f.name for f in AuditLog._meta.fields]

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

