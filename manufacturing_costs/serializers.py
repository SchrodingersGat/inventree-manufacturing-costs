"""API serializers for the ManufacturingCosts plugin.

In practice, you would define your custom serializers here.

Ref: https://www.django-rest-framework.org/api-guide/serializers/
"""

from InvenTree.serializers import (
    InvenTreeCurrencySerializer,
    InvenTreeModelSerializer,
    InvenTreeMoneySerializer,
)
from part.serializers import PartBriefSerializer

from .models import ManufacturingRate, ManufacturingCost


class ManufacturingRateSerializer(InvenTreeModelSerializer):
    """Serializer for the MachiningRate model."""

    class Meta:
        """Meta options for the serializer."""

        model = ManufacturingRate
        fields = [
            "pk",
            "name",
            "description",
            "units",
            "price",
            "price_currency",
        ]

    price = InvenTreeMoneySerializer()
    price_currency = InvenTreeCurrencySerializer()


class ManufacturingCostSerializer(InvenTreeModelSerializer):
    """Serializer for the ManufacturingCost model."""

    class Meta:
        """Meta options for the serializer."""

        model = ManufacturingCost
        fields = [
            "pk",
            "part",
            "part_detail",
            "rate",
            "quantity",
            "unit_cost",
            "unit_cost_currency",
            "notes",
            "amortization",
        ]

    unit_cost = InvenTreeMoneySerializer()
    unit_cost_currency = InvenTreeCurrencySerializer()
    part_detail = PartBriefSerializer(source="part", read_only=True, many=False)
