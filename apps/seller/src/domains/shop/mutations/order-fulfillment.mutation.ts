import type { QueryClient } from '@tanstack/vue-query';
import { resolveMyShopId } from '../utils/resolve-my-shop-id';
import { toastCustom } from '~/shared/config/toast';
import { readApiError } from '~/shared/lib/api-error';
import { shopOrderApi } from '~/domains/shop/api/order/order.api';
import type {
  PrepareFulfillmentShipmentRequest,
  PurchaseShipmentLabelRequest,
  AmendFulfillmentShipmentRequest,
  ReconcileOrderFulfillmentRequest,
  ShipmentRatesRequest,
} from '~/domains/shop/api/order/contracts/order.contract';

function invalidateOrderQueries(queryClient: QueryClient, orderId: string) {
  queryClient.invalidateQueries({ queryKey: ['shop-orders'] });
  queryClient.invalidateQueries({ queryKey: ['shop-order-detail', orderId] });
  // Finance records payout availability when the last unit is delivered, so the
  // progress strip's Payout step must reopen with the order after any shipment
  // change instead of waiting for a page reload.
  queryClient.invalidateQueries({ queryKey: ['shop-order-payout', orderId] });
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

  /** Seller-facing copy for label refund rejections; unknown codes fall back. */
  const LABEL_REFUND_ERROR_MESSAGES: Record<string, string> = {
    SHIPMENT_LABEL_ALREADY_USED:
      'This label was already scanned and cannot be refunded',
  };

  /**
   * Refunds the carrier label. The API voids the Shipment along with it, so the
   * order must be refetched before the row offers any further action.
   */
  const refundLabel = useMutation({
    mutationKey: ['shop-refund-shipment-label'],
    mutationFn: async (input: { orderId: string, shipmentId: string }) => {
      const shopId = await resolveMyShopId(queryClient);
      return await shopOrderApi.refundLabel(shopId, input.orderId, input.shipmentId);
    },
    onSuccess(_result, variables) {
      showSuccess('Label refunded');
      invalidateOrderQueries(queryClient, variables.orderId);
    },
    onError(error) {
      const apiError = readApiError(error);
      showError(
        (apiError.code ? LABEL_REFUND_ERROR_MESSAGES[apiError.code] : undefined) ??
        apiError.message ??
        'Failed to refund label',
      );
    },
  });

  const declareShipmentHandover = useMutation({
    mutationKey: ['shop-declare-shipment-handover'],
    mutationFn: async (input: { orderId: string, shipmentId: string }) => {
      const shopId = await resolveMyShopId(queryClient);
      return await shopOrderApi.declareShipmentHandover(shopId, input.orderId, input.shipmentId);
    },
    onSuccess(_result, variables) {
      showSuccess('Handover declared');
      invalidateOrderQueries(queryClient, variables.orderId);
    },
    onError() {
      showError('Failed to declare handover');
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

  const requestShipmentRates = useMutation({
    mutationKey: ['shop-order-shipment-rates'],
    mutationFn: async (input: { orderId: string, body: ShipmentRatesRequest }) => {
      const shopId = await resolveMyShopId(queryClient);
      return await shopOrderApi.shipmentRates(shopId, input.orderId, input.body);
    },
  });

  /**
   * What the seller sees after a label purchase belongs to the dialog that
   * bought it, so this mutation only records the new shipment and refreshes
   * the order. It deliberately does not toast on success.
   */
  const buyLabel = useMutation({
    mutationKey: ['shop-buy-shipment-label'],
    mutationFn: async (input: { orderId: string, body: PurchaseShipmentLabelRequest }) => {
      const shopId = await resolveMyShopId(queryClient);
      return await shopOrderApi.buyLabel(shopId, input.orderId, input.body);
    },
    onSuccess(_result, variables) {
      invalidateOrderQueries(queryClient, variables.orderId);
    },
    onError() {
      showError('Failed to buy label');
    },
  });

  return {
    prepareShipment,
    buyLabel,
    amendShipment,
    voidShipment,
    refundLabel,
    declareShipmentHandover,
    reconcileFulfillment,
    requestShipmentRates,
  };
}
