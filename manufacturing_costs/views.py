"""API views for the ManufacturingCosts plugin."""

from django_filters import rest_framework as rest_filters
from rest_framework import filters, permissions

from InvenTree.mixins import ListCreateAPI, RetrieveUpdateDestroyAPI
import part.models

from .models import ManufacturingRate, ManufacturingCost
from .serializers import ManufacturingRateSerializer, ManufacturingCostSerializer


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
        fields = []

    part = rest_filters.ModelChoiceFilter(
        queryset=part.models.Part.objects.all(), label="Part", method="filter_part"
    )

    def filter_part(self, queryset, name, part):
        """Filter ManufacturingCost instances by part."""

        parts = part.get_descendants(include_self=True)
        return queryset.filter(part__in=parts)


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
