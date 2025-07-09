"""API views for the ManufacturingCosts plugin.

In practice, you would define your custom views here.

Ref: https://www.django-rest-framework.org/api-guide/views/
"""

from rest_framework import permissions

from InvenTree.mixins import ListCreateAPI, RetrieveUpdateDestroyAPI

from .models import ManufactuingRate, ManufacturingCost
from .serializers import ManufacturingRateSerializer, ManufacturingCostSerializer


class ManufacturingRateMixin:
    """Mixin class for ManufacturingRate API endpoints."""

    # TODO: Fix up the permissions and authentication for this mixin
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ManufacturingRateSerializer
    queryset = ManufactuingRate.objects.all()


class ManufacturingRateList(ManufacturingRateMixin, ListCreateAPI):
    """API endpoint for listing and creating ManufacturingRate instances."""

    ...


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


class ManufacturingCostList(ManufacturingCostMixin, ListCreateAPI):
    """API endpoint for listing and creating ManufacturingCost instances."""

    ...


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
