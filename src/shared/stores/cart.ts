import type { Order } from '~/shared/types/order';
import type { Shop } from '~/shared/types/shop';
import { CheckoutNowSteps, type StateCheckoutNow } from '~/shared/types/pages/checkout';
import { PaymentTypes } from '~/shared/config/enums/order';
import type { Coupon } from '~/shared/types/coupon';
import { CheckoutCartSteps, type StateCheckoutCart } from '~/shared/types/pages/cart/checkout';
import { ROUTES } from '~/shared/config/enums/routes';
import type { ResponseCreateOrder } from '~/shared/types/request-api/order';

export type AdditionInfoShopCarts = {
  key: Shop['id']
  value: {
    promoCodes: Coupon['code'][]
    note: Order['note']
  }
};

export const useCartStore = defineStore('cart', () => {
  const router = useRouter();

  const initStateCheckoutNow: StateCheckoutNow = {
    promoCodes: [],
    note: '',
    invalidCodes: new Map<Coupon['code'], string>(),
    currentStep: CheckoutNowSteps.addressShipping,
    countRefreshConvertCurrency: 0,
    isPendingCreateOrder: false,
    paymentType: PaymentTypes.CASH,
    address: null,
  };
  const stateCheckoutNow = reactive<StateCheckoutNow>({ ...initStateCheckoutNow });
  function resetStateCheckoutNow() {
    Object.assign(stateCheckoutNow, initStateCheckoutNow);
  }

  const initStateCheckoutCart: StateCheckoutCart = {
    invalidCodes: new Map<Coupon['code'], string>(),
    currentStep: CheckoutCartSteps.addressShipping,
    countRefreshConvertCurrency: 0,
    isPendingCreateOrder: false,
    paymentType: PaymentTypes.CASH,
    address: null,
  };
  const stateCheckoutCart = reactive<StateCheckoutCart>({ ...initStateCheckoutCart });

  function resetStateCheckoutCart() {
    Object.assign(stateCheckoutCart, initStateCheckoutCart);
  }

  // use in cart page, checkout cart page
  const additionInfoShopCarts = ref(new Map<AdditionInfoShopCarts['key'], AdditionInfoShopCarts['value']>());

  // use for checkout by cash
  const orderShops = ref<ResponseCreateOrder['order_shops']>([]);

  watch(router.currentRoute, () => {
    if (
      additionInfoShopCarts.value.size &&
      ![`${ROUTES.CART}${ROUTES.CHECKOUT}`, ROUTES.CART].includes(router.currentRoute.value.path)
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
