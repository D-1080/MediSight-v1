from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Custom admin for the MediSight User model.
    Extends Django's built-in UserAdmin so password hashing still works.
    """

    # ── List view ──────────────────────────────────────────────────────────────
    list_display  = ('username', 'full_name', 'email', 'role_badge',
                     'phone', 'is_active', 'is_staff', 'created_at')
    list_filter   = ('role', 'is_active', 'is_staff', 'created_at')
    search_fields = ('username', 'first_name', 'last_name', 'email', 'phone')
    ordering      = ('-created_at',)
    list_per_page = 25

    # ── Detail view ────────────────────────────────────────────────────────────
    fieldsets = (
        ('Login Info', {
            'fields': ('username', 'password'),
        }),
        ('Personal Info', {
            'fields': ('first_name', 'last_name', 'email', 'phone', 'profile_picture'),
        }),
        ('Role & Permissions', {
            'fields': ('role', 'is_active', 'is_staff', 'is_superuser',
                       'groups', 'user_permissions'),
        }),
        ('Important Dates', {
            'fields': ('last_login', 'date_joined'),
            'classes': ('collapse',),
        }),
    )

    # Fields shown when CREATING a new user
    add_fieldsets = (
        ('Create New User', {
            'classes': ('wide',),
            'fields': ('username', 'email', 'first_name', 'last_name',
                       'role', 'phone', 'password1', 'password2', 'is_active'),
        }),
    )

    readonly_fields = ('created_at', 'updated_at', 'last_login', 'date_joined')

    # ── Custom display methods ─────────────────────────────────────────────────
    def full_name(self, obj):
        return obj.get_full_name() or '—'
    full_name.short_description = 'Full Name'

    def role_badge(self, obj):
        colors = {
            'ADMIN':   '#3b82f6',
            'DOCTOR':  '#10b981',
            'ANALYST': '#f59e0b',
            'PATIENT': '#8b5cf6',
        }
        color = colors.get(obj.role, '#6b7280')
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 8px;'
            'border-radius:4px;font-size:11px;font-weight:600;">{}</span>',
            color, obj.role
        )
    role_badge.short_description = 'Role'

    # ── Bulk actions ───────────────────────────────────────────────────────────
    @admin.action(description='Activate selected users')
    def activate_users(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} user(s) activated.')

    @admin.action(description='Deactivate selected users')
    def deactivate_users(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} user(s) deactivated.')

    actions = ['activate_users', 'deactivate_users']


# ── Admin site branding ────────────────────────────────────────────────────────
admin.site.site_header  = 'MediSight Administration'
admin.site.site_title   = 'MediSight Admin'
admin.site.index_title  = 'System Management'