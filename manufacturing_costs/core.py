"""Capture part manufacturing costs"""

from django.contrib.auth.models import Group
from django.utils.translation import gettext_lazy as _

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

    MIN_VERSION = "0.18.0"

    # Plugin settings (from SettingsMixin)
    SETTINGS = {
        "USER_GROUP": {
            "name": _("Allowed Group"),
            "description": _(
                "The user group that is allowed to view manufacturing costs"
            ),
            "model": "auth.group",
        }
    }

    def setup_urls(self):
        """Configure custom URL endpoints for this plugin."""
        from .views import construct_urls

        return construct_urls()

    def is_user_allowed(self, request):
        """Check if the user is allowed to view manufacturing costs."""
        if user_group_id := self.get_setting("USER_GROUP", backup_value=None):
            user_group = Group.objects.filter(id=user_group_id).first()

            if user_group is not None and user_group not in request.user.groups.all():
                return False

        return True

    def get_part_panels(self, part_id: int, request):
        """Return the custom part panel component for this plugin."""

        from part.models import Part

        if not part_id:
            return []

        try:
            instance = Part.objects.get(pk=part_id)
        except (Part.DoesNotExist, ValueError):
            return []

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

    def get_admin_panels(self, request):
        """Return the custom admin panel component for this plugin."""

        return [
            {
                "key": "manufacturing-costs",
                "title": "Manufacturing Rates",
                "description": "Part manufacturing rates",
                "icon": "ti:clock-dollar:outline",
                "source": self.plugin_static_file("AdminPanel.js:renderAdminPanel"),
            }
        ]

    # Custom UI panels
    def get_ui_panels(self, request, context: dict, **kwargs):
        """Return a list of custom panels to be rendered in the InvenTree user interface."""

        # Check if user is allowed to view this plugin
        if not self.is_user_allowed(request):
            return []

        target_model = context.get("target_model", None)
        target_id = context.get("target_id", None)

        if target_model == "admincenter":
            return self.get_admin_panels(request)

        if target_model == "part":
            target_id = context.get("target_id", None)
            return self.get_part_panels(target_id, request)

        # Nothing to do
        return []
