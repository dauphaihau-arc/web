import type { QueryClient } from '@tanstack/vue-query';
import { resolveMyShopId } from '../utils/resolve-my-shop-id';
import { toastCustom } from '~/shared/config/toast';
import { shopOrderApi } from '~/domains/shop/api/order/order.api';
import type {
  PrepareFulfillmentShipmentRequest,
  AmendFulfillmentShipmentRequest,
  UpdateShipmentJourneyRequest,
  ReconcileOrderFulfillmentRequest,
} from '~/domains/shop/api/order/contracts/order.contract';

function invalidateOrderQueries(queryClient: QueryClient, orderId: string) {
  queryClient.invalidateQueries({ queryKey: ['shop-orders'] });
  queryClient.invalidateQueries({ queryKey: ['shop-order-detail', orderId] });
}

export function useShopOrderFulfillmentMutations() {
  const queryClient = useQueryClient();
  const toast = useToast();

  function showSuccess(title: string) {
    toast.add({
      ...toastCustom.success,
      title,
    });
  }

  function showError(title: string) {
    toast.add({
      ...toastCustom.error,
      title,
    });
  }

  const prepareShipment = useMutation({
    mutationKey: ['shop-prepare-fulfillment-shipment'],
    mutationFn: async (input: { orderId: string, body: PrepareFulfillmentShipmentRequest }) => {
      const shopId = await resolveMyShopId(queryClient);
      return await shopOrderApi.prepareFulfillmentShipment(shopId, input.orderId, input.body);
    },
    onSuccess(_result, variables) {
      showSuccess('Shipment prepared');
      invalidateOrderQueries(queryClient, variables.orderId);
    },
    onError() {
      showError('Failed to prepare shipment');
    },
  });

  const amendShipment = useMutation({
    mutationKey: ['shop-amend-fulfillment-shipment'],
    mutationFn: async (input: { orderId: string, shipmentId: string, body: AmendFulfillmentShipmentRequest }) => {
      const shopId = await resolveMyShopId(queryClient);
      return await shopOrderApi.amendFulfillmentShipment(shopId, input.orderId, input.shipmentId, input.body);
    },
    onSuccess(_result, variables) {
      showSuccess('Shipment amended');
      invalidateOrderQueries(queryClient, variables.orderId);
    },
    onError() {
      showError('Failed to amend shipment');
    },
  });

  const voidShipment = useMutation({
    mutationKey: ['shop-void-fulfillment-shipment'],
    mutationFn: async (input: { orderId: string, shipmentId: string }) => {
      const shopId = await resolveMyShopId(queryClient);
      return await shopOrderApi.voidFulfillmentShipment(shopId, input.orderId, input.shipmentId);
    },
    onSuccess(_result, variables) {
      showSuccess('Shipment voided');
      invalidateOrderQueries(queryClient, variables.orderId);
    },
    onError() {
      showError('Failed to void shipment');
    },
  });

  const updateShipmentJourney = useMutation({
    mutationKey: ['shop-update-shipment-journey'],
    mutationFn: async (input: { orderId: string, shipmentId: string, body: UpdateShipmentJourneyRequest }) => {
      const shopId = await resolveMyShopId(queryClient);
      return await shopOrderApi.updateShipmentJourney(shopId, input.orderId, input.shipmentId, input.body);
    },
    onSuccess(_result, variables) {
      showSuccess('Shipment status updated');
      invalidateOrderQueries(queryClient, variables.orderId);
    },
    onError() {
      showError('Failed to update shipment status');
    },
  });

  const reconcileFulfillment = useMutation({
    mutationKey: ['shop-reconcile-order-fulfillment'],
    mutationFn: async (input: { orderId: string, body: ReconcileOrderFulfillmentRequest }) => {
      const shopId = await resolveMyShopId(queryClient);
      return await shopOrderApi.reconcileOrderFulfillment(shopId, input.orderId, input.body);
    },
    onSuccess(_result, variables) {
      showSuccess('Fulfillment reconciled');
      invalidateOrderQueries(queryClient, variables.orderId);
    },
    onError() {
      showError('Failed to reconcile fulfillment');
    },
  });

  return {
    prepareShipment,
    amendShipment,
    voidShipment,
    updateShipmentJourney,
    reconcileFulfillment,
  };
}
