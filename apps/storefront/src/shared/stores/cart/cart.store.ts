import { PaymentTypes } from '@arc/enums/order';
import {
  CheckoutNowSteps, CheckoutCartSteps, type StateCheckoutNow, type StateCheckoutCart
} from '~/shared/stores/cart/cart.store.types';
import { routePaths } from '~/shared/navigation/routes';
import type { CreateOrderResponse } from '~/shared/api/me/order/contracts/order.contract';

export type AdditionInfoShopCarts = {
  key: string
  value: {
    promoCodes: string[]
    note: string
  }
};

export const useCartStore = defineStore('cart', () => {
  const router = useRouter();

  const initStateCheckoutNow: StateCheckoutNow = {
    promoCodes: [],
    note: '',
    invalidCodes: new Map<string, string>(),
    currentStep: CheckoutNowSteps.ADDRESS_SHIPPING,
    countRefreshConvertCurrency: 0,
    isPendingCreateOrder: false,
    paymentType: PaymentTypes.CASH,
    address: null,
    guestEmail: '',
  };
  const stateCheckoutNow = reactive<StateCheckoutNow>({ ...initStateCheckoutNow });
  function resetStateCheckoutNow() {
    Object.assign(stateCheckoutNow, initStateCheckoutNow);
  }

  const initStateCheckoutCart: StateCheckoutCart = {
    invalidCodes: new Map<string, string>(),
    currentStep: CheckoutCartSteps.ADDRESS_SHIPPING,
    countRefreshConvertCurrency: 0,
    isPendingCreateOrder: false,
    paymentType: PaymentTypes.CASH,
    address: null,
    guestEmail: '',
  };
  const stateCheckoutCart = reactive<StateCheckoutCart>({ ...initStateCheckoutCart });

  function resetStateCheckoutCart() {
    Object.assign(stateCheckoutCart, initStateCheckoutCart);
  }

  // use in cart page, checkout cart page
  const additionInfoShopCarts = ref(new Map<AdditionInfoShopCarts['key'], AdditionInfoShopCarts['value']>());

  // use for checkout by cash
  const orderShops = ref<CreateOrderResponse['order_shops']>([]);

  watch(router.currentRoute, () => {
    const activeCheckoutPaths: string[] = [routePaths.cartCheckout, routePaths.cart];

    if (
      additionInfoShopCarts.value.size &&
      !activeCheckoutPaths.includes(router.currentRoute.value.path)
    ) {
      additionInfoShopCarts.value.clear();
    }
  });

  return {
    orderShops,
    stateCheckoutNow,
    stateCheckoutCart,
    additionInfoShopCarts,
    resetStateCheckoutCart,
    resetStateCheckoutNow,
  };
});
