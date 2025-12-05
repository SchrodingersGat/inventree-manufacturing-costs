"""Custom model definitions for the ManufacturingCosts plugin."""

from decimal import Decimal

from django.contrib.auth.models import User
from django.db import models
from django.utils.translation import gettext_lazy as _

from djmoney.money import Money

import InvenTree.helpers
from InvenTree.fields import InvenTreeModelMoneyField


class ManufacturingRate(models.Model):
    """Model to store manufacturing 'rates' for different processes."""

    class Meta:
        """Meta options for the model."""

        app_label = "manufacturing_costs"

    def __str__(self):
        """String representation of the manufacturing rate."""
        return self.name

    @staticmethod
    def get_api_url():
        """Return the API URL for this manufacturing rate."""
        return "/plugin/manufacturing-costs/rate/"

    name = models.CharField(
        max_length=100,
        unique=True,
        verbose_name=_("Name"),
        help_text=_("Name of the manufacturing rate"),
    )

    description = models.CharField(
        max_length=200,
        verbose_name=_("Description"),
        help_text=_("Description of the manufacturing rate"),
    )

    # TODO: Implement custom validation for the 'units' field

    units = models.CharField(
        max_length=50,
        verbose_name=_("Units"),
        blank=True,
        help_text=_("Units for the manufacturing rate"),
    )

    price = InvenTreeModelMoneyField(
        max_digits=19,
        decimal_places=6,
        allow_negative=False,
        verbose_name=_("Cost"),
        help_text=_("Manufacturing rate cost"),
    )


class ManufacturingCost(models.Model):
    """Model to store manufacturing costs associated with a part."""

    class Meta:
        """Meta options for the model."""

        app_label = "manufacturing_costs"

    def save(self, *args, **kwargs):
        """Custom save method."""

        self.updated = InvenTree.helpers.current_time()
        super().save(*args, **kwargs)

    @staticmethod
    def api_url():
        """Return the API URL for this manufacturing cost."""
        return "/plugin/manufacturing-costs/cost/"

    active = models.BooleanField(
        default=True,
        verbose_name=_("Active"),
        help_text=_("Is this manufacturing cost active?"),
    )

    inherited = models.BooleanField(
        default=False,
        verbose_name=_("Inherited"),
        help_text=_("Is this manufacturing cost inherited by variant parts?"),
    )

    part = models.ForeignKey(
        "part.Part",
        on_delete=models.CASCADE,
        related_name="manufacturing_costs",
        verbose_name=_("Part"),
        help_text=_("The part associated with this manufacturing cost"),
    )

    rate = models.ForeignKey(
        ManufacturingRate,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="manufacturing_costs",
        verbose_name=_("Manufacturing Rate"),
        help_text=_("The manufacturing rate used for this cost"),
    )

    quantity = models.DecimalField(
        max_digits=19,
        decimal_places=6,
        default=1,
        verbose_name=_("Quantity"),
        help_text=_("Quantity of the part for which this cost applies"),
    )

    # Note: The unit cost will override the rate cost if provided
    unit_cost = InvenTreeModelMoneyField(
        max_digits=19,
        decimal_places=6,
        null=True,
        blank=True,
        allow_negative=False,
        verbose_name=_("Cost"),
        help_text=_("Cost of manufacturing this part"),
    )

    description = models.CharField(
        max_length=200,
        blank=True,
        verbose_name=_("Description"),
        help_text=_("Description of this manufacturing cost"),
    )

    notes = models.CharField(
        max_length=200,
        blank=True,
        verbose_name=_("Notes"),
        help_text=_("Additional notes about this manufacturing cost"),
    )

    updated = models.DateTimeField(
        verbose_name=_("Updated"),
        help_text=_("Timestamp of last update"),
        default=None,
        blank=True,
        null=True,
    )

    updated_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="%(class)s_updated",
        verbose_name=_("Update By"),
        help_text=_("User who last updated this object"),
    )

    def calculate_cost(self, quantity: Decimal) -> Money:
        """Calculate the total manufacturing cost for a given quantity.

        - If a 'rate' is specified, use the rate price.
        - Otherwise, use the 'unit_cost' if specified.
        """

        if self.rate is not None:
            return self.rate.price * quantity

        elif self.unit_cost is not None:
            return self.unit_cost * quantity

        return Money(0, "USD")  # Default to zero cost if neither is specified
