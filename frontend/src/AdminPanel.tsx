// Import for type checking
import {
  apiUrl,
  checkPluginVersion,
  formatCurrencyValue,
  type InvenTreePluginContext
} from '@inventreedb/ui';
import {
  ActionIcon,
  Alert,
  CloseButton,
  Group,
  Stack,
  Text,
  TextInput,
  Tooltip
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import {
  IconCopy,
  IconEdit,
  IconExclamationCircle,
  IconInfoCircle,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconTrash
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { DataTable } from 'mantine-datatable';
import { useCallback, useEffect, useMemo, useState } from 'react';

// Search input component
// TODO: Work out how to import this from @inventreedb/ui
function SearchInput({
  searchCallback
}: Readonly<{
  searchCallback: (searchTerm: string) => void;
}>) {
  const [value, setValue] = useState<string>('');
  const [searchText] = useDebouncedValue(value, 500);

  useEffect(() => {
    searchCallback(searchText);
  }, [searchText]);

  return (
    <TextInput
      value={value}
      aria-label='table-search-input'
      leftSection={<IconSearch />}
      placeholder={`Search`}
      onChange={(event) => setValue(event.target.value)}
      rightSection={
        value.length > 0 ? (
          <CloseButton
            size='xs'
            onClick={() => {
              setValue('');
              searchCallback('');
            }}
          />
        ) : null
      }
    />
  );
}

export function ManufacturingCostsAdminPanel({
  context
}: {
  context: InvenTreePluginContext;
}) {
  const RATE_URL: string = '/plugin/manufacturing-costs/rate/';

  const [searchTerm, setSearchTerm] = useState<string>('');

  // Fetch API data from the example API endpoint
  // It will re-fetch when the partId changes
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
          .then((response) => response.data);
      }
    },
    context.queryClient
  );

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
      {
        title: 'Edit',
        color: 'blue',
        icon: <IconEdit />,
        onClick: () => {
          setSelectedRecord(record);
          editRateForm?.open();
        }
      },
      {
        title: 'Duplicate',
        color: 'green',
        icon: <IconCopy />,
        onClick: () => {
          setSelectedRecord(record);
          duplicateRateForm?.open();
        }
      },
      {
        title: 'Delete',
        color: 'red',
        icon: <IconTrash />,
        onClick: () => {
          setSelectedRecord(record);
          deleteRateForm?.open();
        }
      }
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
        sortable: true,
        render: (record: any) => {
          return (
            <Group gap='sm'>
              <Text>
                {formatCurrencyValue(record.price, {
                  currency: record.price_currency
                })}
              </Text>
              {record.units && <Text size='sm'>[{record.units}]</Text>}
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
        render: (record: any, index: number) => {
          return '...';
          // <RowActions
          //   actions={rowActions(record)}
          //   index={index}
          // />
        }
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
            <Tooltip label='Add new rate'>
              <ActionIcon
                color='green'
                variant='transparent'
                onClick={() => {
                  createRateForm?.open();
                }}
              >
                <IconPlus />
              </ActionIcon>
            </Tooltip>
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

  // Activate the i18n context for the current locale
  (context as any).i18n.activate(context.locale);

  return <ManufacturingCostsAdminPanel context={context} />;
}
