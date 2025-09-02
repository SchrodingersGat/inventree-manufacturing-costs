"""Custom model definitions for the ManufacturingCosts plugin."""

from decimal import Decimal

from django.core.validators import MinValueValidator
from django.db import models
from django.utils.translation import gettext_lazy as _

from djmoney.modey import Money

from InvenTree.fields import InvenTreeModelMoneyField


class ManufacturingRate(models.Model):
    """Model to store manufacturing 'rates' for different processes."""

    class Meta:
        """Meta options for the model."""

        app_label = "manufacturing_costs"

    def __str__(self):
        """String representation of the manufacturing rate."""
        return self.name

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

    notes = models.CharField(
        max_length=200,
        blank=True,
        verbose_name=_("Notes"),
        help_text=_("Additional notes about this manufacturing cost"),
    )

    # NOTE: This field is currently not used in the frontend
    amortization = models.PositiveIntegerField(
        default=1,
        verbose_name=_("Amortization Quantity"),
        help_text=_("Part quantity over which the cost is amortized"),
        validators=[
            MinValueValidator(1, _("Amortization quantity must be at least 1"))
        ],
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
