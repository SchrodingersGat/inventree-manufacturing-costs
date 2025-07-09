"""Admin site configuration for the ManufacturingCosts plugin."""

from django.contrib import admin

from .models import ManufactuingRate, ManufacturingCost


@admin.register(ManufactuingRate)
class ManufacturingRateAdmin(admin.ModelAdmin):
    """Admin interface for the ManufacturingRate."""

    list_display = ("name", "description", "price")


@admin.register(ManufacturingCost)
class ManufacturingCostAdmin(admin.ModelAdmin):
    """Admin interface for the ManufacturingCost model."""

    list_display = (
        "part",
        "rate",
        "quantity",
    )
