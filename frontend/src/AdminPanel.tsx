// Import for type checking
import {
  checkPluginVersion,
  type InvenTreePluginContext
} from '@inventreedb/ui';
import { Accordion, Title } from '@mantine/core';
import CostTable from './CostTable';
import RateTable from './RateTable';

export function ManufacturingCostsAdminPanel({
  context
}: {
  context: InvenTreePluginContext;
}) {
  return (
    <Accordion defaultValue={['rates']} multiple>
      <Accordion.Item value='rates'>
        <Accordion.Control>
          <Title c={context.theme.primaryColor} order={4}>
            Manufacturing Rates
          </Title>
        </Accordion.Control>
        <Accordion.Panel>
          <RateTable context={context} />
        </Accordion.Panel>
      </Accordion.Item>
      <Accordion.Item value='costs'>
        <Accordion.Control>
          <Title c={context.theme.primaryColor} order={4}>
            Manufacturing Costs
          </Title>
        </Accordion.Control>
        <Accordion.Panel>
          <CostTable context={context} />
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  );
}

// This is the function which is called by InvenTree to render the actual panel component
export function renderAdminPanel(context: InvenTreePluginContext) {
  checkPluginVersion(context);

  return <ManufacturingCostsAdminPanel context={context} />;
}
