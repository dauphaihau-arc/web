import type { Order } from '~/types/order';
import type { Shop } from '~/types/shop';
import { CHECKOUT_NOW_STEPS, type StateCheckoutNow } from '~/types/pages/checkout';
import { PAYMENT_TYPES } from '~/config/enums/order';
import type { Coupon } from '~/types/coupon';
import { CHECKOUT_CART_STEPS, type StateCheckoutCart } from '~/types/pages/cart/checkout';
import { ROUTES } from '~/config/enums/routes';
import type { ResponseCreateOrder } from '~/types/request-api/order';

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
    currentStep: CHECKOUT_NOW_STEPS.ADDRESS_SHIPPING,
    countRefreshConvertCurrency: 0,
    isPendingCreateOrder: false,
    paymentType: PAYMENT_TYPES.CARD,
    address: null,
  };
  const stateCheckoutNow = reactive<StateCheckoutNow>({ ...initStateCheckoutNow });
  function resetStateCheckoutNow() {
    Object.assign(stateCheckoutNow, initStateCheckoutNow);
  }

  const initStateCheckoutCart: StateCheckoutCart = {
    invalidCodes: new Map<Coupon['code'], string>(),
    currentStep: CHECKOUT_CART_STEPS.ADDRESS_SHIPPING,
    countRefreshConvertCurrency: 0,
    isPendingCreateOrder: false,
    paymentType: PAYMENT_TYPES.CARD,
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
