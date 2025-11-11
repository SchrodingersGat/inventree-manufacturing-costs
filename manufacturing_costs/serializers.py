"""API serializers for the ManufacturingCosts plugin."""

from rest_framework import serializers


from InvenTree.serializers import (
    InvenTreeCurrencySerializer,
    InvenTreeDecimalField,
    InvenTreeModelSerializer,
    InvenTreeMoneySerializer,
)

import part.models as part_models
from part.serializers import PartBriefSerializer
from users.serializers import UserSerializer

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
            "description",
            "active",
            "inherited",
            "part",
            "part_detail",
            "rate",
            "rate_detail",
            "quantity",
            "unit_cost",
            "unit_cost_currency",
            "notes",
            "updated",
            "updated_by",
            "updated_by_detail",
        ]

        read_only_fields = ["updated", "updated_by"]

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
    updated_by_detail = UserSerializer(
        source="updated_by", many=False, read_only=True, allow_null=True
    )

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

    def save(self):
        """Save the model instance."""

        instance = super().save()

        if request := self.context.get("request", None):
            instance.updated_by = request.user
            instance.save()

        return instance


class AssemblyCostRequestSerializer(serializers.Serializer):
    """Serializer for requesting manufacturing cost data for an assembly."""

    part = serializers.PrimaryKeyRelatedField(
        queryset=part_models.Part.objects.filter(assembly=True),
        many=False,
        required=True,
        label="Assembly Part",
        help_text="Select the assembly part for which to retrieve manufacturing costs",
    )

    include_subassemblies = serializers.BooleanField(
        required=False,
        default=True,
        label="Include Sub-assemblies",
        help_text="Include manufacturing costs for sub-assemblies",
    )

    export_format = serializers.ChoiceField(
        choices=[("csv", "CSV"), ("xls", "XLS"), ("xlsx", "XLSX")],
        required=False,
        default="csv",
        label="Export Format",
        help_text="Select the format for exporting the manufacturing cost data",
    )
