"""API views for the ManufacturingCosts plugin."""

from typing import cast

import tablib

from django.db.models import Q
from django_filters import rest_framework as rest_filters
from rest_framework import filters, permissions
from rest_framework.views import APIView

from InvenTree.helpers import DownloadFile
from InvenTree.mixins import ListCreateAPI, RetrieveUpdateDestroyAPI
import part.models

from .models import ManufacturingRate, ManufacturingCost
from .serializers import (
    ManufacturingRateSerializer,
    ManufacturingCostSerializer,
    AssemblyCostRequestSerializer,
)


class ManufacturingRateMixin:
    """Mixin class for ManufacturingRate API endpoints."""

    # TODO: Fix up the permissions and authentication for this mixin
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ManufacturingRateSerializer
    queryset = ManufacturingRate.objects.all()


class ManufacturingRateList(ManufacturingRateMixin, ListCreateAPI):
    """API endpoint for listing and creating ManufacturingRate instances."""

    filter_backends = [filters.OrderingFilter, filters.SearchFilter]

    ordering_fields = [
        "pk",
        "name",
        "units",
    ]

    search_fields = [
        "name",
        "description",
    ]


class ManufacturingRateDetail(ManufacturingRateMixin, RetrieveUpdateDestroyAPI):
    """API endpoint for retrieving, updating, and deleting a ManufacturingRate instance."""

    ...


class ManufacturingCostMixin:
    """Mixin class for ManufacturingCost API endpoints."""

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ManufacturingCostSerializer
    queryset = ManufacturingCost.objects.all()

    def get_queryset(self):
        """Return the queryset for the ManufacturingRate model."""
        queryset = super().get_queryset()
        queryset = queryset.prefetch_related("part")

        return queryset


class ManufacturingCostFilter(rest_filters.FilterSet):
    """Filter class for ManufacturingCost API endpoints."""

    class Meta:
        model = ManufacturingCost
        fields = [
            "active",
            "inherited",
        ]

    part = rest_filters.ModelChoiceFilter(
        queryset=part.models.Part.objects.all(), label="Part", method="filter_part"
    )

    def filter_part(self, queryset, name, part):
        """Filter ManufacturingCost instances by part."""

        parts = part.get_ancestors(include_self=True)
        Q1 = Q(part__in=parts, inherited=True)
        Q2 = Q(part=part, inherited=False)

        return queryset.filter(Q1 | Q2).distinct()


class ManufacturingCostList(ManufacturingCostMixin, ListCreateAPI):
    """API endpoint for listing and creating ManufacturingCost instances."""

    filterset_class = ManufacturingCostFilter

    filter_backends = [
        rest_filters.DjangoFilterBackend,
        filters.OrderingFilter,
        filters.SearchFilter,
    ]

    ordering_fields = ["pk", "part", "rate", "quantity"]

    search_fields = [
        "part__name",
        "part__IPN",
        "rate__name",
        "rate__description",
        "notes",
    ]


class ManufacturingCostDetail(ManufacturingCostMixin, RetrieveUpdateDestroyAPI):
    """API endpoint for retrieving, updating, and deleting a ManufacturingCost instance."""

    ...


class AssemblyCostExport(APIView):
    """API endpoint for exporting ManufacturingCost data for a single assembly."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Export manufacturing cost data for a given assembly part."""

        serializer = AssemblyCostRequestSerializer(data=request.query_params)

        serializer.is_valid(raise_exception=True)
        data = cast(dict, serializer.validated_data)

        self.part = data["part"]
        self.include_subassemblies = data.get("include_subassemblies", True)
        self.export_format = data.get("export_format", "csv")

        return self.export_data()

    def export_data(self):
        """Construct a dataset for export."""

        headers = self.file_headers()
        dataset = tablib.Dataset(headers=map(str, headers))

        # TODO: Implement data population logic here

        data = dataset.export(self.export_format)

        return DownloadFile(
            data,
            filename=f"assembly_costs_{self.part.full_name}.{self.export_format}",
        )

    def file_headers(self):
        """Return the headers for the exported dataset."""

        return ["Part ID", "IPN", "Part Name"]


def construct_urls():
    """Construct the URL patterns for the ManufacturingCosts plugin."""

    from django.urls import path, include

    return [
        path(
            "rate/",
            include([
                path(
                    "<int:pk>/",
                    ManufacturingRateDetail.as_view(),
                    name="manufacturing-rate-detail",
                ),
                path(
                    "", ManufacturingRateList.as_view(), name="manufacturing-rate-list"
                ),
            ]),
        ),
        path(
            "cost/",
            include([
                path(
                    "export/",
                    AssemblyCostExport.as_view(),
                    name="assembly-cost-export",
                ),
                path(
                    "<int:pk>/",
                    ManufacturingCostDetail.as_view(),
                    name="manufacturing-cost-detail",
                ),
                path(
                    "", ManufacturingCostList.as_view(), name="manufacturing-cost-list"
                ),
            ]),
        ),
    ]
