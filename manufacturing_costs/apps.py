"""Django config for the ManufacturingCosts plugin."""

from django.apps import AppConfig


class ManufacturingCostsConfig(AppConfig):
    """Config class for the ManufacturingCosts plugin."""

    name = "manufacturing_costs"

    def ready(self):
        """This function is called whenever the ManufacturingCosts plugin is loaded."""
        ...
