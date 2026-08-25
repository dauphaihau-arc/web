import { ICON_NAME_BY_ALIAS } from '@arc/ui/foundation/app-icon.constants';
import type { Notification } from '#ui/types';

interface ToastCustom {
  [key: string]: Partial<Notification>
}

export const toastCustom: ToastCustom = {
  error: {
    color: 'red',
    icon: ICON_NAME_BY_ALIAS.warning,
  },
  success: {
    color: 'green',
    icon: ICON_NAME_BY_ALIAS.check,
  },
  info: {
    color: 'blue',
    icon: ICON_NAME_BY_ALIAS.info,
  },
  warning: {
    color: 'yellow',
    icon: ICON_NAME_BY_ALIAS.warning,
  },
};
