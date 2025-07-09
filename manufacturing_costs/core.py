"""Capture part manufacturing costs"""

from plugin import InvenTreePlugin

from plugin.mixins import AppMixin, SettingsMixin, UrlsMixin, UserInterfaceMixin

from . import PLUGIN_VERSION


class ManufacturingCosts(
    AppMixin, SettingsMixin, UrlsMixin, UserInterfaceMixin, InvenTreePlugin
):
    """ManufacturingCosts - custom InvenTree plugin."""

    # Plugin metadata
    TITLE = "Manufacturing Costs"
    NAME = "ManufacturingCosts"
    SLUG = "manufacturing-costs"
    DESCRIPTION = "Capture part manufacturing costs"
    VERSION = PLUGIN_VERSION

    # Additional project information
    AUTHOR = "Oliver Walters"
    WEBSITE = "https://github.com/SchrodingersGat/inventree-manufacturing-costs"
    LICENSE = "MIT"

    # Optionally specify supported InvenTree versions
    # MIN_VERSION = '0.18.0'
    # MAX_VERSION = '2.0.0'

    # Plugin settings (from SettingsMixin)
    # Ref: https://docs.inventree.org/en/latest/plugins/mixins/settings/
    SETTINGS = {
        # Define your plugin settings here...
        "CUSTOM_VALUE": {
            "name": "Custom Value",
            "description": "A custom value",
            "validator": int,
            "default": 42,
        }
    }

    # Custom URL endpoints (from UrlsMixin)
    # Ref: https://docs.inventree.org/en/latest/plugins/mixins/urls/
    def setup_urls(self):
        """Configure custom URL endpoints for this plugin."""
        from django.urls import path
        from .views import ExampleView

        return [
            # Provide path to a simple custom view - replace this with your own views
            path("example/", ExampleView.as_view(), name="example-view"),
        ]

    # User interface elements (from UserInterfaceMixin)
    # Ref: https://docs.inventree.org/en/latest/plugins/mixins/ui/

    def get_part_panels(self, part_id: int):
        """Return the custom part panel component for this plugin."""

        from part.models import Part

        if not part_id:
            return []

        try:
            instance = Part.objects.get(pk=part_id)
        except (Part.DoesNotExist, ValueError):
            return []

        # TODO: Check if the user has permission to view the manufacturing data

        if not instance.assembly:
            # If the part is not an assembly, do not display the panel
            return []

        return [
            {
                "key": "manufacturing-costs",
                "title": "Manufacturing Costs",
                "description": "Part manufacturing costs",
                "icon": "ti:clock-dollar:outline",
                "source": self.plugin_static_file("PartPanel.js:renderPartPanel"),
            }
        ]

    def get_admin_panels(self):
        """Return the custom admin panel component for this plugin."""

        return [
            {
                "key": "manufacturing-costs",
                "title": "Manufacturing Costs",
                "description": "Part manufacturing costs",
                "icon": "ti:clock-dollar:outline",
                "source": self.plugin_static_file("AdminPanel.js:renderAdminPanel"),
            }
        ]

    # Custom UI panels
    def get_ui_panels(self, request, context: dict, **kwargs):
        """Return a list of custom panels to be rendered in the InvenTree user interface."""

        target_model = context.get("target_model", None)
        target_id = context.get("target_id", None)

        if target_model == "admincenter":
            return self.get_admin_panels()

        if target_model == "part":
            target_id = context.get("target_id", None)
            return self.get_part_panels(target_id)

        # Nothing to do
        return []
