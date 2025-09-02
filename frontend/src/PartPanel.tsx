// Import for type checking
import {
  AddItemButton,
  type ApiFormFieldSet,
  apiUrl,
  checkPluginVersion,
  formatCurrencyValue,
  formatDecimal,
  type InvenTreePluginContext,
  ModelType,
  RowActions,
  RowDeleteAction,
  RowEditAction,
  SearchInput
} from '@inventreedb/ui';
import {
  ActionIcon,
  Alert,
  Group,
  HoverCard,
  Stack,
  Text,
  Tooltip
} from '@mantine/core';
import {
  IconExclamationCircle,
  IconInfoCircle,
  IconRefresh,
  IconUser
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { DataTable } from 'mantine-datatable';
import { useCallback, useMemo, useState } from 'react';

function RenderRate({ instance }: { instance: any }) {
  return (
    <Group gap='xs' justify='space-between'>
      <Text>{instance.name}</Text>
      <Text size='xs'>{instance.description}</Text>
    </Group>
  );
}

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

  // Record which is selected in the table
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  const costFields: ApiFormFieldSet = useMemo(() => {
    return {
      part: {
        value: partId,
        disabled: true
      },
      description: {},
      quantity: {},
      rate: {
        api_url: apiUrl(RATE_URL),
        modelRenderer: RenderRate
      },
      unit_cost: {},
      unit_cost_currency: {},
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
        render: (record: any) => record.part_detail?.full_name
      },
      {
        accessor: 'part_detail.IPN',
        title: 'IPN'
      },
      {
        accessor: 'description',
        title: 'Description'
      },
      {
        accessor: 'quantity',
        title: 'Quantity',
        format: (value: any) => formatDecimal(value)
      },
      {
        accessor: 'rate',
        title: 'Rate',
        render: (record: any) => {
          const rate = record.rate_detail;

          let unit_cost: string | number | null = '';

          if (rate) {
            unit_cost = formatCurrencyValue(rate.price, {
              currency: rate.price_currency
            });
          } else {
            unit_cost = formatCurrencyValue(record.unit_cost, {
              currency: record.unit_cost_currency
            });
          }

          return (
            <Group justify='space-between' gap='sm'>
              <Text>{unit_cost}</Text>
              {rate && (
                <HoverCard>
                  <HoverCard.Target>
                    <ActionIcon variant='transparent' size='sm'>
                      <IconInfoCircle />
                    </ActionIcon>
                  </HoverCard.Target>
                  <HoverCard.Dropdown>
                    <RenderRate instance={rate} />
                  </HoverCard.Dropdown>
                </HoverCard>
              )}
            </Group>
          );
        }
      },
      {
        accessor: 'notes',
        title: 'Notes'
      },
      {
        accessor: 'updated',
        title: 'Updated',
        render: (record: any) => {
          return (
            <Group justify='space-between'>
              <Text>{record.updated}</Text>
              {record.updated_by_detail && (
                <HoverCard>
                  <HoverCard.Target>
                    <ActionIcon variant='transparent' size='sm'>
                      <IconUser />
                    </ActionIcon>
                  </HoverCard.Target>
                  <HoverCard.Dropdown>
                    {context.renderInstance({
                      model: ModelType.user,
                      instance: record.updated_by_detail
                    })}
                  </HoverCard.Dropdown>
                </HoverCard>
              )}
            </Group>
          );
        }
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
  checkPluginVersion(context);
  return <ManufacturingCostsPanel context={context} />;
}
