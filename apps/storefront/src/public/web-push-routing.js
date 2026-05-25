const routePaths = {
  home: '/',
  orders: '/orders',
};

function buildOrderDetailPath(id) {
  return `${routePaths.orders}/${id}`;
}

export function getNotificationTargetPath(data) {
  if (!data || typeof data.type !== 'string') {
    return routePaths.home;
  }

  switch (data.type) {
    case 'order.canceled':
    case 'order.shipping.pre_transit':
    case 'order.shipping.in_transit':
    case 'order.shipping.shipped':
    case 'order.shipping.delivered':
      return typeof data.orderId === 'string' && data.orderId.length > 0 ?
        buildOrderDetailPath(data.orderId) :
        routePaths.orders;
    default:
      return routePaths.home;
  }
}
