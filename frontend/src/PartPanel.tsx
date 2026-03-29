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
  RowDuplicateAction,
  RowEditAction,
  RowViewAction,
  SearchInput,
  YesNoButton
} from '@inventreedb/ui';
import {
  ActionIcon,
  Alert,
  Button,
  Group,
  HoverCard,
  Stack,
  Text,
  Tooltip
} from '@mantine/core';
import {
  IconExclamationCircle,
  IconFileDownload,
  IconInfoCircle,
  IconRefresh,
  IconUser
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { DataTable } from 'mantine-datatable';
import { useCallback, useEffect, useMemo, useState } from 'react';

function RenderRate({ instance }: { instance: any }) {
  return (
    <Group gap='xs' justify='space-between'>
      <Text>{instance.name}</Text>
      <Group gap='xs' justify='right'>
        <Text size='xs'>{instance.description}</Text>
        {instance.units && <Text size='xs'>[{instance.units}]</Text>}
      </Group>
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
  const EXPORT_URL: string = '/plugin/manufacturing-costs/cost/export/';

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

  const [selectedRate, setSelectedRate] = useState<any>(null);

  useEffect(() => {
    // Update the selected rate whenever the selected record changes
    setSelectedRate(selectedRecord?.rate || null);
  }, [selectedRecord]);

  const processFormData = (data: any) => {
    // If a 'rate' object is provided, remove the 'unit_cost' field
    if (data.rate) {
      data.unit_cost = null;
    }

    return data;
  };

  const costFields: ApiFormFieldSet = useMemo(() => {
    return {
      part: {
        value: partId,
        disabled: true
      },
      description: {},
      rate: {
        api_url: apiUrl(RATE_URL),
        modelRenderer: RenderRate,
        preFieldContent: (
          <Alert
            color='blue'
            icon={<IconInfoCircle />}
            title='Manufacturing Rate'
          >
            If a rate is selected, the unit cost will be calculated based on the
            rate price and quantity.
          </Alert>
        ),
        onValueChange(value) {
          setSelectedRate(value || null);
        }
      },
      unit_cost: {
        onValueChange() {
          setSelectedRate(null);
        },
        disabled: !!selectedRate
      },
      unit_cost_currency: {
        disabled: !!selectedRate
      },
      amount: {},
      amortization: {},
      notes: {},
      inherited: {},
      active: {}
    };
  }, [selectedRate]);

  const createCostForm = context.forms.create({
    url: apiUrl(COST_URL),
    title: 'Add Manufacturing Cost',
    fields: costFields,
    successMessage: 'Cost created',
    onFormSuccess: () => {
      dataQuery.refetch();
    },
    processFormData: processFormData
  });

  const duplicateCostForm = context.forms.create({
    url: apiUrl(COST_URL),
    title: 'Add Manufacturing Cost',
    fields: costFields,
    successMessage: 'Cost created',
    initialData: selectedRecord,
    onFormSuccess: () => {
      dataQuery.refetch();
    },
    processFormData: processFormData
  });

  const editCostForm = context.forms.edit({
    url: apiUrl(COST_URL, selectedRecord?.pk),
    title: 'Edit Manufacturing Cost',
    fields: costFields,
    successMessage: 'Cost updated',
    onFormSuccess: () => {
      dataQuery.refetch();
    },
    processFormData: processFormData
  });

  const deleteCostForm = context.forms.delete({
    url: apiUrl(COST_URL, selectedRecord?.pk),
    title: 'Delete Manufacturing Cost',
    successMessage: 'Cost deleted',
    onFormSuccess: () => {
      dataQuery.refetch();
    }
  });

  const exportDataForm = context.forms.create({
    url: apiUrl(EXPORT_URL),
    method: 'GET',
    title: 'Export Manufacturing Costs',
    fetchInitialData: false,
    ignorePermissionCheck: true,
    submitText: 'Export',
    fields: {
      part: {
        field_type: 'integer',
        value: partId,
        hidden: true
      },
      export_format: {
        label: 'Export Format',
        description: 'Select the format for data export',
        field_type: 'choice',
        choices: [
          { display_name: 'CSV', value: 'csv' },
          { display_name: 'XLS', value: 'xls' },
          { display_name: 'XLSX', value: 'xlsx' }
        ],
        default: 'csv'
      },
      include_subassemblies: {
        field_type: 'boolean',
        label: 'Include Sub-assemblies',
        description:
          'Include manufacturing costs from sub-assemblies for this part',
        default: true
      }
    },
    onFormSuccess: (data: any) => {
      if (data.complete && data.output) {
        window.open(data.output, '_blank');
      }
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
        RowDuplicateAction({
          onClick: () => {
            setSelectedRecord(record);
            duplicateCostForm?.open();
          }
        }),
        RowDeleteAction({
          onClick: () => {
            setSelectedRecord(record);
            deleteCostForm?.open();
          },
          hidden: record.part != partPk
        }),
        RowViewAction({
          // onClick: (event: any) => {
          //   const url = getDetailUrl(ModelType.part, record.part);
          //   navigateToLink(url, context.navigate, event);
          // },
          hidden: record.part == partPk,
          title: 'View Part',
          modelType: ModelType.part,
          modelId: Number.parseInt(record.part) || -1,
          navigate: context.navigate
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
        render: (record: any) => <Text>{record.amount}</Text>
      },
      {
        accessor: 'amortization',
        title: 'Amortization',
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
        accessor: 'cost',
        title: 'Unit Cost',
        render: (record: any) => {
          // Calculate the actual "unit cost" value, based on the provided information
          // 1. If a manufacturing rate is provided, calculate the unit cost based on the rate price and quantity
          // 2. If no rate is provided, use the unit cost value directly from the record
          const quantity = (record.quantity || 0) / (record.amortization || 1);
          const price = record.rate_detail?.price || record.unit_cost || 0;
          const currency =
            record.rate_detail?.price_currency || record.unit_cost_currency;

          return formatCurrencyValue(price, {
            currency: currency,
            multiplier: quantity
          });
        }
      },
      {
        accessor: 'notes',
        title: 'Notes'
      },
      {
        accessor: 'inherited',
        title: 'Inherited',
        render: (record: any) => <YesNoButton value={record.inherited} />
      },
      {
        accessor: 'active',
        title: 'Active',
        render: (record: any) => <YesNoButton value={record.active} />
      },
      {
        accessor: 'updated',
        title: 'Updated',
        render: (record: any) => {
          return (
            <Group justify='space-between'>
              <Text size='sm'>{record.updated}</Text>
              {record.updated_by_detail && (
                <HoverCard position='bottom-end'>
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
  }, [dataQuery.data]);

  return (
    <>
      {createCostForm.modal}
      {duplicateCostForm.modal}
      {editCostForm.modal}
      {deleteCostForm.modal}
      {exportDataForm.modal}
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
              tooltip='Add new cost'
              tooltipAlignment='top-start'
              onClick={() => {
                setSelectedRate(null);
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
            <Button
              leftSection={<IconFileDownload />}
              onClick={() => exportDataForm.open()}
            >
              Export
            </Button>
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
