// Import for type checking
import {
  checkPluginVersion,
  type InvenTreePluginContext,
  ModelType
} from '@inventreedb/ui';
import { Stack } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { DataTable } from 'mantine-datatable';
import { useMemo } from 'react';

/**
 * Render a custom panel with the provided context.
 * Refer to the InvenTree documentation for the context interface
 * https://docs.inventree.org/en/latest/plugins/mixins/ui/#plugin-context
 */
function ManufacturingCostsPanel({
  context
}: {
  context: InvenTreePluginContext;
}) {
  const partId = useMemo(() => {
    return context.model == ModelType.part ? context.id || null : null;
  }, [context.model, context.id]);

  const dataQuery = useQuery(
    {
      queryKey: ['manufacturing-cost', partId],
      queryFn: async () => {
        const url = `/plugin/manufacturing-costs/cost/`;

        return (
          context.api
            ?.get(url, {
              params: {
                part: partId
              }
            })
            .then((response) => response.data)
            .catch(() => []) ?? []
        );
      }
    },
    context.queryClient
  );

  const tableColums: any[] = useMemo(() => {
    return [
      {
        accessor: 'part',
        title: 'Part'
      },
      {
        accessor: 'rate',
        title: 'Rate'
      }
    ];
  }, []);

  return (
    <>
      <Stack gap='xs'>
        <DataTable columns={tableColums} records={dataQuery.data || []} />
      </Stack>
    </>
  );
}

// This is the function which is called by InvenTree to render the actual panel component
// export function renderPartPanel(component: HTMLDivElement, context: InvenTreePluginContext) {
export function renderPartPanel(context: InvenTreePluginContext) {
  checkPluginVersion(context);
  return <ManufacturingCostsPanel context={context} />;
}
