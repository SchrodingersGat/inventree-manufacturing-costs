// Import for type checking
import {
  AddItemButton,
  apiUrl,
  checkPluginVersion,
  formatCurrencyValue,
  type InvenTreePluginContext,
  RowActions,
  RowDeleteAction,
  RowDuplicateAction,
  RowEditAction,
  SearchInput,
  useMonitorDataOutput
} from '@inventreedb/ui';
import { ActionIcon, Alert, Group, Stack, Text, Tooltip } from '@mantine/core';
import {
  IconExclamationCircle,
  IconFileDownload,
  IconInfoCircle,
  IconRefresh
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { DataTable } from 'mantine-datatable';

import { useCallback, useMemo, useState } from 'react';

export function ManufacturingCostsAdminPanel({
  context
}: {
  context: InvenTreePluginContext;
}) {
  const [searchTerm, setSearchTerm] = useState<string>('');

  const RATE_URL: string = '/plugin/manufacturing-costs/rate/';

  // Fetch manufacturing rates from the API
  const dataQuery = useQuery(
    {
      queryKey: ['manufacturing-rate', searchTerm],
      queryFn: async () => {
        return context?.api
          ?.get(RATE_URL, {
            params: {
              search: searchTerm
            }
          })
          .then((response: any) => response.data);
      }
    },
    context.queryClient
  );

  const [outputId, setOutputId] = useState<number | undefined>(undefined);

  useMonitorDataOutput({
    api: context.api,
    queryClient: context.queryClient,
    id: outputId,
    title: 'Exporting manufacturing rates'
  });

  // Use the default exporter to download the manufacturing rates as a CSV file
  const downloadRates = useCallback(() => {
    context.api
      ?.get(apiUrl(RATE_URL), {
        params: {
          search: searchTerm,
          export: true,
          export_format: 'csv',
          export_plugin: 'inventree-exporter'
        }
      })
      .then((response) => {
        if (response.data?.pk) {
          setOutputId(response.data.pk);
        }
      });
  }, [context.api, searchTerm]);

  const rateFields: any = useMemo(() => {
    return {
      name: {},
      description: {},
      price: {},
      price_currency: {},
      units: {}
    };
  }, []);

  // Record which is selected in the table
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  // Modal form to create a new rate
  const createRateForm = context.forms.create({
    url: apiUrl(RATE_URL),
    title: 'Add Rate',
    fields: rateFields,
    successMessage: 'Rate created',
    onFormSuccess: () => {
      dataQuery.refetch();
    }
  });

  // Modal form to edit the selected rate
  const editRateForm = context.forms.edit({
    url: apiUrl(RATE_URL, selectedRecord?.pk),
    title: 'Edit Rate',
    fields: rateFields,
    successMessage: 'Rate updated',
    onFormSuccess: () => {
      dataQuery.refetch();
    }
  });

  // Modal form to delete the selected rate
  const deleteRateForm = context.forms.delete({
    url: apiUrl(RATE_URL, selectedRecord?.pk),
    title: 'Delete Rate',
    successMessage: 'Rate deleted',
    onFormSuccess: () => {
      dataQuery.refetch();
    }
  });

  // Modal form to duplicate the selected rate
  const duplicateRateForm = context.forms.create({
    url: apiUrl(RATE_URL),
    title: 'Add Rate',
    fields: rateFields,
    initialData: {
      ...selectedRecord
    },
    successMessage: 'Rate created',
    onFormSuccess: () => {
      dataQuery.refetch();
    }
  });

  // Render the actions available for a given row in the table
  const rowActions = useCallback((record: any) => {
    return [
      RowEditAction({
        onClick: () => {
          setSelectedRecord(record);
          editRateForm?.open();
        }
      }),
      RowDuplicateAction({
        onClick: () => {
          setSelectedRecord(record);
          duplicateRateForm?.open();
        }
      }),
      RowDeleteAction({
        onClick: () => {
          setSelectedRecord(record);
          deleteRateForm?.open();
        }
      })
    ];
  }, []);

  const dataColumns: any[] = useMemo(() => {
    return [
      {
        accessor: 'name',
        sortable: true
      },
      {
        accessor: 'description'
      },
      {
        accessor: 'price',
        title: 'Rate',
        sortable: true,
        render: (record: any) => {
          return (
            <Group gap='sm'>
              <Text>
                {formatCurrencyValue(record.price, {
                  currency: record.price_currency
                })}
              </Text>
              {record.units && <Text size='xs'>[{record.units}]</Text>}
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
      {createRateForm?.modal}
      {editRateForm?.modal}
      {duplicateRateForm?.modal}
      {deleteRateForm?.modal}
      <Stack gap='xs'>
        <Alert
          color='blue'
          icon={<IconInfoCircle />}
          title={'Manufacturing Rates'}
        >
          Predefined rates for different manufaucturing processes. These can be
          referenced to assign manufaucturing costs to parts.
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
                createRateForm?.open();
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
            <Tooltip label='Download data' position='top-end'>
              <ActionIcon variant='transparent' onClick={downloadRates}>
                <IconFileDownload />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>
        <DataTable
          minHeight={250}
          withTableBorder
          withColumnBorders
          idAccessor={'pk'}
          noRecordsText='No manufacturing rates found'
          records={dataQuery.data || []}
          fetching={dataQuery.isFetching || dataQuery.isLoading}
          columns={dataColumns}
          pinLastColumn
        />
      </Stack>
    </>
  );
}

// This is the function which is called by InvenTree to render the actual panel component
export function renderAdminPanel(context: InvenTreePluginContext) {
  checkPluginVersion(context);

  return <ManufacturingCostsAdminPanel context={context} />;
}
