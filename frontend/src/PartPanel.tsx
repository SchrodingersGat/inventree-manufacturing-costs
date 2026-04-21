// Import for type checking
import {
  checkPluginVersion,
  type InvenTreePluginContext,
  ModelType
} from '@inventreedb/ui';
import { useMemo } from 'react';
import CostTable from './CostTable';

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

  return <CostTable context={context} partId={partId} />;
}

// This is the function which is called by InvenTree to render the actual panel component
// export function renderPartPanel(component: HTMLDivElement, context: InvenTreePluginContext) {
export function renderPartPanel(context: InvenTreePluginContext) {
  checkPluginVersion(context);
  return <ManufacturingCostsPanel context={context} />;
}
