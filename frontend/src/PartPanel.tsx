// Import for type checking
import {
  AddItemButton,
  type ApiFormFieldSet,
  apiUrl,
  formatCurrencyValue,
  formatDecimal,
  type InvenTreePluginContext,
  initPlugin,
  ModelType,
  RowActions,
  RowDeleteAction,
  RowEditAction,
  SearchInput
} from '@inventreedb/ui';
import { ActionIcon, Alert, Group, Stack, Text, Tooltip } from '@mantine/core';
import {
  IconExclamationCircle,
  IconInfoCircle,
  IconRefresh
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { DataTable } from 'mantine-datatable';
import { useCallback, useMemo, useState } from 'react';

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

  const [searchTerm, setSearchTerm] = useState<string>('');

  const RATE_URL: string = '/plugin/manufacturing-costs/rate/';
  const COST_URL: string = '/plugin/manufacturing-costs/cost/';

  const dataQuery = useQuery(
    {
      queryKey: ['manufacturing-cost', partId, searchTerm],
      queryFn: async () => {
        const url = `${COST_URL}`;

        return (
          context.api
            ?.get(url, {
              params: {
                part: partId,
                search: searchTerm
              }
            })
            .then((response) => response.data)
            .catch(() => []) ?? []
        );
      }
    },
    context.queryClient
  );

  function RenderRate({ instance }: { instance: any }) {
    return (
      <Group gap='xs' justify='space-between'>
        <Text>{instance.name}</Text>
        <Text size='sm'>{instance.description}</Text>
      </Group>
    );
  }

  // Record which is selected in the table
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  const costFields: ApiFormFieldSet = useMemo(() => {
    return {
      part: {
        value: partId,
        disabled: true
      },
      quantity: {},
      rate: {
        api_url: apiUrl(RATE_URL),
        modelRenderer: RenderRate
      },
      unit_cost: {},
      unit_cost_currency: {},
      amortization: {},
      notes: {}
    };
  }, []);

  const createCostForm = context.forms.create({
    url: apiUrl(COST_URL),
    title: 'Add Manufacturing Cost',
    fields: costFields,
    successMessage: 'Cost created',
    onFormSuccess: () => {
      dataQuery.refetch();
    }
  });

  const editCostForm = context.forms.edit({
    url: apiUrl(COST_URL, selectedRecord?.pk),
    title: 'Edit Manufacturing Cost',
    fields: costFields,
    successMessage: 'Cost updated',
    onFormSuccess: () => {
      dataQuery.refetch();
    }
  });

  const deleteCostForm = context.forms.delete({
    url: apiUrl(COST_URL, selectedRecord?.pk),
    title: 'Delete Manufacturing Cost',
    successMessage: 'Cost deleted',
    onFormSuccess: () => {
      dataQuery.refetch();
    }
  });

  // Render the actions available for a given row in the table
  const rowActions = useCallback(
    (record: any) => {
      const partPk = context.instance.pk;

      return [
        RowEditAction({
          onClick: () => {
            setSelectedRecord(record);
            editCostForm?.open();
          },
          hidden: record.part != partPk
        }),
        RowDeleteAction({
          onClick: () => {
            setSelectedRecord(record);
            deleteCostForm?.open();
          },
          hidden: record.part != partPk
        })
      ];
    },
    [context.instance]
  );

  const tableColums: any[] = useMemo(() => {
    return [
      {
        accessor: 'part',
        title: 'Part',
        render: (record: any) => {
          return context.renderInstance({
            instance: record.part_detail,
            model: ModelType.part
          });
        }
      },
      {
        accessor: 'part_detail.IPN',
        title: 'IPN'
      },
      {
        accessor: 'rate',
        title: 'Rate',
        render: (record: any) => {
          const rate = record.rate_detail;

          if (!rate) {
            return '-';
          }

          return <RenderRate instance={rate} />;
        }
      },
      {
        accessor: 'quantity',
        title: 'Quantity',
        format: (value: any) => formatDecimal(value)
      },
      {
        accessor: 'unit_cost',
        title: 'Unit Cost',
        render: (record: any) => {
          return (
            <Group gap='sm'>
              <Text>
                {formatCurrencyValue(record.unit_cost, {
                  currency: record.unit_cost_currency
                })}
              </Text>
              {record.units && <Text size='sm'>[{record.units}]</Text>}
            </Group>
          );
        },
        sortable: true
      },
      {
        accessor: 'amortization',
        title: 'Amortization',
        sortable: true
      },
      {
        accessor: 'notes',
        title: 'Notes'
      },
      {
        accessor: '---',
        title: ' ',
        width: 50,
        resizable: false,
        sortable: false,
        render: (record: any, index: number) => (
          <RowActions actions={rowActions(record)} index={index} />
        )
      }
    ];
  }, []);

  return (
    <>
      {createCostForm.modal}
      {editCostForm.modal}
      {deleteCostForm.modal}
      <Stack gap='xs'>
        <Alert
          color='blue'
          icon={<IconInfoCircle />}
          title={'Manufacturing Costs'}
        >
          Additional manufacturing costs associated with this assembly.
        </Alert>
        {dataQuery.isError && (
          <Alert
            color='red'
            title='Error Fetching Data'
            icon={<IconExclamationCircle />}
          >
            {dataQuery.error instanceof Error
              ? dataQuery.error.message
              : 'An error occurred while fetching data from the server.'}
          </Alert>
        )}
        <Group justify='space-between'>
          <Group gap='xs'>
            <AddItemButton
              tooltip='Add new rate'
              onClick={() => {
                createCostForm.open();
              }}
            />
          </Group>
          <Group gap='xs'>
            <SearchInput
              searchCallback={(value: string) => {
                setSearchTerm(value);
              }}
            />
            <Tooltip label='Refresh data' position='top-end'>
              <ActionIcon
                variant='transparent'
                onClick={() => {
                  dataQuery.refetch();
                }}
              >
                <IconRefresh />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>
        <DataTable
          minHeight={250}
          withTableBorder
          withColumnBorders
          idAccessor={'pk'}
          noRecordsText='No manufacturing costs found'
          fetching={dataQuery.isFetching || dataQuery.isLoading}
          columns={tableColums}
          records={dataQuery.data || []}
          pinLastColumn
        />
      </Stack>
    </>
  );
}

// This is the function which is called by InvenTree to render the actual panel component
// export function renderPartPanel(component: HTMLDivElement, context: InvenTreePluginContext) {
export function renderPartPanel(context: InvenTreePluginContext) {
  initPlugin(context);
  return <ManufacturingCostsPanel context={context} />;
}
