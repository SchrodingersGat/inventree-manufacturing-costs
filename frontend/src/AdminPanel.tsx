// Import for type checking
import {
  ActionButton,
  AddItemButton,
  ApiEndpoints,
  apiUrl,
  checkPluginVersion,
  formatCurrencyValue,
  type InvenTreePluginContext,
  InvenTreeTable,
  RowDeleteAction,
  RowDuplicateAction,
  RowEditAction,
  type TableColumn,
  useTable
} from '@inventreedb/ui';
import { Alert, Group, Stack, Text } from '@mantine/core';
import { IconFileUpload, IconInfoCircle } from '@tabler/icons-react';

import { useCallback, useMemo, useState } from 'react';

export function ManufacturingCostsAdminPanel({
  context
}: {
  context: InvenTreePluginContext;
}) {
  const RATE_URL: string = '/plugin/manufacturing-costs/rate/';

  const tableState = useTable('manufacturing-rates');

  // TODO: Implement custom table filters here
  // const tableFilters: TableFilter[] = [];

  const importRatesForm = context.forms.create({
    url: apiUrl(ApiEndpoints.import_session_list),
    title: 'Import Manufacturing Rates',
    fields: {
      data_file: {},
      model_type: {
        value: 'manufacturingrate',
        hidden: true
      },
      update_records: {}
    },
    onFormSuccess: (response: any) => {
      const sessionId = response.pk;

      context.importer?.open?.(sessionId, {
        onClose: () => {
          tableState.refreshTable();
        }
      });
    }
  });

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
    table: tableState
  });

  // Modal form to edit the selected rate
  const editRateForm = context.forms.edit({
    url: apiUrl(RATE_URL, selectedRecord?.pk),
    title: 'Edit Rate',
    fields: rateFields,
    successMessage: 'Rate updated',
    table: tableState
  });

  // Modal form to delete the selected rate
  const deleteRateForm = context.forms.delete({
    url: apiUrl(RATE_URL, selectedRecord?.pk),
    title: 'Delete Rate',
    successMessage: 'Rate deleted',
    table: tableState
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
    table: tableState
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

  const dataColumns: TableColumn[] = useMemo(() => {
    return [
      {
        accessor: 'name',
        sortable: true,
        switchable: false
      },
      {
        accessor: 'description',
        sortable: false
      },
      {
        accessor: 'price',
        title: 'Rate',
        sortable: false,
        switchable: false,
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
      }
    ];
  }, []);

  const tableActions = useMemo(
    () => [
      <ActionButton
        tooltip='Import from file'
        tooltipAlignment='top-start'
        onClick={() => {
          importRatesForm.open();
        }}
        icon={<IconFileUpload />}
      />,
      <AddItemButton
        tooltip='Add new rate'
        onClick={() => {
          createRateForm?.open();
        }}
      />
    ],
    []
  );

  return (
    <>
      {createRateForm?.modal}
      {editRateForm?.modal}
      {duplicateRateForm?.modal}
      {deleteRateForm?.modal}
      {importRatesForm?.modal}
      <Stack gap='xs'>
        <Alert
          color='blue'
          icon={<IconInfoCircle />}
          title={'Manufacturing Rates'}
        >
          Predefined rates for different manufacturing processes. These can be
          referenced to assign manufacturing costs to parts.
        </Alert>
        <InvenTreeTable
          url={RATE_URL}
          tableState={tableState}
          columns={dataColumns}
          props={{
            enableDownload: true,
            rowActions: rowActions,
            tableActions: tableActions
          }}
          context={context}
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
