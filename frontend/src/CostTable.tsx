// Import for type checking
import {
  ActionButton,
  AddItemButton,
  ApiEndpoints,
  type ApiFormFieldSet,
  apiUrl,
  formatCurrencyValue,
  formatDecimal,
  type InvenTreePluginContext,
  InvenTreeTable,
  ModelType,
  RowDeleteAction,
  RowDuplicateAction,
  RowEditAction,
  RowViewAction,
  type TableColumn,
  type TableFilter,
  useTable,
  YesNoButton
} from '@inventreedb/ui';
import {
  ActionIcon,
  Alert,
  Group,
  HoverCard,
  Stack,
  Text
} from '@mantine/core';
import {
  IconFileDownload,
  IconFileUpload,
  IconInfoCircle,
  IconUser
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';

function RenderRate({ instance }: { instance: any }) {
  if (!instance) {
    return '-';
  }

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

export default function CostTable({
  context,
  partId
}: {
  context: InvenTreePluginContext;
  partId?: string | number | null;
}) {
  const RATE_URL: string = '/plugin/manufacturing-costs/rate/';
  const COST_URL: string = '/plugin/manufacturing-costs/cost/';
  const EXPORT_URL: string = '/plugin/manufacturing-costs/cost/export/';

  const tableState = useTable('manufacturing-costs');

  const rates = useQuery(
    {
      queryKey: ['manufacturing-rates', partId],
      queryFn: async () => {
        // Return a list of all manufacturing rates
        return context.api.get(RATE_URL).then((response: any) => {
          return response.data.map((rate: any) => {
            return {
              value: `${rate.pk}`,
              label: rate.name,
              ...rate
            };
          });
        });
      }
    },
    context.queryClient
  );

  const tableFilters: TableFilter[] = useMemo(
    () => [
      {
        name: 'active',
        label: 'Active',
        description: 'Show active costs'
      },
      {
        name: 'inherited',
        label: 'Inherited',
        description: 'Show inherited costs'
      },
      {
        name: 'rate',
        label: 'Rate',
        description: 'Filter costs by manufacturing rate',
        type: 'choice',
        choices: rates.data || [],
        active: rates.isFetched && rates.isSuccess
      }
    ],
    [rates]
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
    const isSuperUser = context?.user?.isSuperuser?.() ?? false;

    return {
      part: {
        value: partId,
        filters: {
          assembly: true,
          disabled: !isSuperUser
        }
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
  }, [context.user, partId, selectedRate]);

  const createCostForm = context.forms.create({
    url: apiUrl(COST_URL),
    title: 'Add Manufacturing Cost',
    fields: costFields,
    successMessage: 'Cost created',
    table: tableState,
    processFormData: processFormData
  });

  const duplicateCostForm = context.forms.create({
    url: apiUrl(COST_URL),
    title: 'Add Manufacturing Cost',
    fields: costFields,
    successMessage: 'Cost created',
    initialData: selectedRecord,
    table: tableState,
    processFormData: processFormData
  });

  const editCostForm = context.forms.edit({
    url: apiUrl(COST_URL, selectedRecord?.pk),
    title: 'Edit Manufacturing Cost',
    fields: costFields,
    successMessage: 'Cost updated',
    table: tableState,
    processFormData: processFormData
  });

  const deleteCostForm = context.forms.delete({
    url: apiUrl(COST_URL, selectedRecord?.pk),
    title: 'Delete Manufacturing Cost',
    successMessage: 'Cost deleted',
    table: tableState
  });

  const importCostsForm = context.forms.create({
    url: apiUrl(ApiEndpoints.import_session_list),
    title: 'Import Manufacturing Costs',
    fields: {
      data_file: {},
      model_type: {
        value: 'manufacturingcost',
        hidden: true
      },
      update_records: {},
      field_overrides: {
        hidden: true,
        value: {
          part: partId || undefined
        }
      }
    },
    onFormSuccess: (response: any) => {
      const sessionId = response.pk;

      (context as any).importer?.open?.(sessionId, {
        onClose: () => {
          tableState.refreshTable();
        },
        fields: {
          rate: {
            api_url: apiUrl(RATE_URL),
            modelRenderer: RenderRate
          }
        }
      });
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
      return [
        RowEditAction({
          onClick: () => {
            setSelectedRecord(record);
            editCostForm?.open();
          },
          hidden: !!partId && record.part != partId
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
          hidden: !!partId && record.part != partId
        }),
        RowViewAction({
          hidden: !!partId && record.part != partId,
          title: 'View Part',
          modelType: ModelType.part,
          modelId: Number.parseInt(record.part) || -1,
          navigate: context.navigate
        })
      ];
    },
    [partId, context.instance]
  );

  const tableColumns: TableColumn[] = useMemo(() => {
    const cols: TableColumn[] = [
      {
        accessor: 'part',
        title: 'Part',
        switchable: false,
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
        switchable: false,
        render: (record: any) => <Text>{record.amount}</Text>
      },
      {
        accessor: 'amortization',
        title: 'Amortization',
        render: (record: any) => formatDecimal(record.amortization)
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
        switchable: true,
        title: 'Notes'
      },
      {
        accessor: 'inherited',
        switchable: true,
        title: 'Inherited',
        render: (record: any) => <YesNoButton value={record.inherited} />
      },
      {
        accessor: 'active',
        title: 'Active',
        switchable: true,
        render: (record: any) => <YesNoButton value={record.active} />
      },
      {
        accessor: 'updated',
        switchable: true,
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
      }
    ];

    return cols;
  }, []);

  const tableActions = useMemo(() => {
    return [
      <ActionButton
        tooltip='Export costs to file'
        tooltipAlignment='top-start'
        onClick={() => exportDataForm.open()}
        icon={<IconFileDownload />}
        disabled={!partId}
      />,
      <ActionButton
        tooltip='Import from file'
        tooltipAlignment='top-start'
        onClick={() => {
          importCostsForm.open();
        }}
        icon={<IconFileUpload />}
      />,
      <AddItemButton
        tooltip='Add new cost'
        tooltipAlignment='top-start'
        onClick={() => {
          setSelectedRate(null);
          createCostForm.open();
        }}
      />
    ];
  }, [partId]);

  return (
    <>
      {createCostForm.modal}
      {duplicateCostForm.modal}
      {editCostForm.modal}
      {deleteCostForm.modal}
      {importCostsForm.modal}
      {exportDataForm.modal}
      <Stack gap='xs'>
        {partId && (
          <Alert
            color='blue'
            icon={<IconInfoCircle />}
            title={'Manufacturing Costs'}
          >
            Additional manufacturing costs associated with this assembly.
          </Alert>
        )}
        <InvenTreeTable
          url={COST_URL}
          columns={tableColumns}
          tableState={tableState}
          props={{
            params: {
              part: partId
            },
            rowActions: rowActions,
            tableActions: tableActions,
            tableFilters: tableFilters
          }}
          context={context}
        />
      </Stack>
    </>
  );
}
