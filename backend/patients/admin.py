from django.contrib import admin
from django.utils.html import format_html
from .models import Patient


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):

    # ── List view ──────────────────────────────────────────────────────────────
    list_display  = ('patient_id', 'full_name', 'age', 'gender_display',
                     'blood_group', 'phone', 'prediction_count', 'is_active', 'created_at')
    list_filter   = ('gender', 'blood_group', 'is_active', 'created_at')
    search_fields = ('patient_id', 'first_name', 'last_name', 'email', 'phone')
    ordering      = ('-created_at',)
    list_per_page = 25

    # ── Detail view ────────────────────────────────────────────────────────────
    # Note: 'age' and 'full_name' are @property on the model — not editable
    readonly_fields = ('patient_id', 'age', 'full_name', 'created_at', 'updated_at')

    fieldsets = (
        ('Identity', {
            'fields': ('patient_id', 'first_name', 'last_name', 'date_of_birth',
                       'gender', 'blood_group', 'is_active'),
        }),
        ('Contact', {
            'fields': ('email', 'phone', 'address'),
        }),
        ('Medical History', {
            'fields': ('medical_history',),
            'classes': ('wide',),
        }),
        ('System Info', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

    # ── Custom display methods ─────────────────────────────────────────────────
    def gender_display(self, obj):
        labels = {'M': ('Male', '#3b82f6'), 'F': ('Female', '#ec4899'), 'O': ('Other', '#6b7280')}
        label, color = labels.get(obj.gender, ('—', '#6b7280'))
        return format_html('<span style="color:{};">{}</span>', color, label)
    gender_display.short_description = 'Gender'

    def prediction_count(self, obj):
        """Count via reverse FK relation — not a model field."""
        count = obj.predictions.count()
        color = '#10b981' if count > 0 else '#6b7280'
        return format_html('<span style="color:{};font-weight:600;">{}</span>', color, count)
    prediction_count.short_description = 'Predictions'

    # ── Bulk actions ───────────────────────────────────────────────────────────
    @admin.action(description='Mark selected patients as active')
    def mark_active(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} patient(s) marked as active.')

    @admin.action(description='Mark selected patients as inactive')
    def mark_inactive(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} patient(s) marked as inactive.')

    actions = ['mark_active', 'mark_inactive']