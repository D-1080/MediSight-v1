from django.contrib import admin
from django.utils.html import format_html
from .models import Prediction


@admin.register(Prediction)
class PredictionAdmin(admin.ModelAdmin):
    """
    Admin view for Prediction records.
    Provides status management, risk filtering, and bulk review actions.
    """

    # ── List view ──────────────────────────────────────────────────────────────
    list_display  = ('id', 'patient_link', 'disease_badge', 'risk_badge',
                     'probability_bar', 'status_badge', 'model_version', 'created_at')
    list_filter   = ('disease_type', 'risk_level', 'status', 'model_version', 'created_at')
    search_fields = ('patient__patient_id', 'patient__first_name', 'patient__last_name')
    ordering      = ('-created_at',)
    list_per_page = 25
    readonly_fields = ('created_at', 'updated_at', 'probability', 'risk_level',
                       'confidence', 'disease_type', 'input_features',
                       'shap_values', 'model_version', 'patient')

    # ── Detail view ────────────────────────────────────────────────────────────
    fieldsets = (
        ('Patient & Disease', {
            'fields': ('patient', 'disease_type'),
        }),
        ('Prediction Result', {
            'fields': ('probability', 'risk_level', 'confidence', 'model_version'),
        }),
        ('Review', {
            'fields': ('status', 'notes'),
        }),
        ('Input Data', {
            'fields': ('input_features',),
            'classes': ('collapse',),
        }),
        ('SHAP Explanation', {
            'fields': ('shap_values',),
            'classes': ('collapse',),
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

    # ── Custom display ─────────────────────────────────────────────────────────
    def patient_link(self, obj):
        return format_html(
            '<a href="/admin/patients/patient/{}/change/">{}</a>',
            obj.patient.id, obj.patient.patient_id
        )
    patient_link.short_description = 'Patient'

    def disease_badge(self, obj):
        colors = {
            'DIABETES': '#3b82f6',
            'HEART':    '#ef4444',
            'STROKE':   '#f59e0b',
            'CKD':      '#8b5cf6',
        }
        labels = {
            'DIABETES': 'Diabetes',
            'HEART':    'Heart',
            'STROKE':   'Stroke',
            'CKD':      'Kidney',
        }
        color = colors.get(obj.disease_type, '#6b7280')
        label = labels.get(obj.disease_type, obj.disease_type)
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 8px;'
            'border-radius:4px;font-size:11px;font-weight:600;">{}</span>',
            color, label
        )
    disease_badge.short_description = 'Disease'

    def risk_badge(self, obj):
        colors = {'LOW': '#10b981', 'MEDIUM': '#f59e0b', 'HIGH': '#ef4444'}
        color  = colors.get(obj.risk_level, '#6b7280')
        return format_html(
            '<span style="color:{};font-weight:700;">{}</span>',
            color, obj.risk_level
        )
    risk_badge.short_description = 'Risk'

    def probability_bar(self, obj):
        pct   = round(obj.probability, 1)
        color = '#ef4444' if pct >= 60 else '#f59e0b' if pct >= 30 else '#10b981'
        return format_html(
            '<div style="display:flex;align-items:center;gap:6px;">'
            '<div style="width:80px;height:8px;background:#374151;border-radius:4px;">'
            '<div style="width:{}%;height:100%;background:{};border-radius:4px;"></div>'
            '</div><span style="font-size:12px;color:#9ca3af;">{}%</span></div>',
            min(pct, 100), color, pct
        )
    probability_bar.short_description = 'Probability'

    def status_badge(self, obj):
        configs = {
            'PENDING':  ('#f59e0b', 'Pending'),
            'REVIEWED': ('#10b981', 'Reviewed'),
            'ARCHIVED': ('#6b7280', 'Archived'),
        }
        color, label = configs.get(obj.status, ('#6b7280', obj.status))
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 8px;'
            'border-radius:4px;font-size:11px;">{}</span>',
            color, label
        )
    status_badge.short_description = 'Status'

    # ── Bulk actions ───────────────────────────────────────────────────────────
    @admin.action(description='Mark selected predictions as Reviewed')
    def mark_reviewed(self, request, queryset):
        updated = queryset.update(status='REVIEWED')
        self.message_user(request, f'{updated} prediction(s) marked as Reviewed.')

    @admin.action(description='Mark selected predictions as Archived')
    def mark_archived(self, request, queryset):
        updated = queryset.update(status='ARCHIVED')
        self.message_user(request, f'{updated} prediction(s) archived.')

    @admin.action(description='Reset selected predictions to Pending')
    def mark_pending(self, request, queryset):
        updated = queryset.update(status='PENDING')
        self.message_user(request, f'{updated} prediction(s) reset to Pending.')

    actions = ['mark_reviewed', 'mark_archived', 'mark_pending']