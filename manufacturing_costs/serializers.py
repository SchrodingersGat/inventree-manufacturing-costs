"""API serializers for the ManufacturingCosts plugin."""

from rest_framework import serializers

from InvenTree.serializers import (
    InvenTreeCurrencySerializer,
    InvenTreeDecimalField,
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
            "rate_detail",
            "quantity",
            "unit_cost",
            "unit_cost_currency",
            "notes",
        ]

    rate = serializers.PrimaryKeyRelatedField(
        queryset=ManufacturingRate.objects.all(),
        allow_null=True,
        required=False,
    )

    quantity = InvenTreeDecimalField()

    unit_cost = InvenTreeMoneySerializer(allow_null=True)
    unit_cost_currency = InvenTreeCurrencySerializer()
    part_detail = PartBriefSerializer(source="part", read_only=True, many=False)
    rate_detail = ManufacturingRateSerializer(source="rate", read_only=True, many=False)

    def validate(self, data):
        """Validate the provided data."""

        data = super().validate(data)

        rate = data.get("rate", None)
        unit_cost = data.get("unit_cost", None)

        if rate is not None and unit_cost is not None:
            msg = "Only one of 'rate' or 'unit_cost' should be specified"
            raise serializers.ValidationError({
                "rate": msg,
                "unit_cost": msg,
            })

        return data
