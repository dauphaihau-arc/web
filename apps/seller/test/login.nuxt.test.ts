import {
  describe, it, expect, beforeEach, vi,
} from 'vitest';
import { FetchError } from 'ofetch';
import { flushPromises, mount } from '@vue/test-utils';
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime';
import { routes } from '~/shared/navigation/routes';
import LayoutShopHeader from '~/app/layouts/shop/header.vue';
import LoginForm from '~/app/pages/login/_components/login-form.vue';

const { mockNavigateTo, loginMock } = vi.hoisted(() => ({
  mockNavigateTo: vi.fn(),
  loginMock: vi.fn(),
}));

mockNuxtImport('navigateTo', () => mockNavigateTo);

vi.mock('~/domains/auth/mutations/login.mutation', () => ({
  useLogin: () => ({
    mutateAsync: loginMock,
    isPending: false,
  }),
}));

vi.mock('~/domains/auth/queries/client-config.query', () => ({
  useAuthClientConfig: () => ({
    data: { value: undefined },
    isLoading: false,
  }),
}));

describe('login', () => {
  beforeEach(() => {
    mockNavigateTo.mockReset();
    loginMock.mockReset();
  });

  it('mounts seller header', async () => {
    const component = await mountSuspended(LayoutShopHeader, {
      global: {
        stubs: {
          NotificationPopover: true,
          ShortcutHint: true,
        },
      },
    });

    expect(component.exists()).toBeTruthy();
  });

  it('navigates from the seller header keyboard shortcut', async () => {
    await mountSuspended(LayoutShopHeader, {
      global: {
        stubs: {
          NotificationPopover: true,
          ShortcutHint: true,
        },
      },
    });

    document.body.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'c',
      bubbles: true,
    }));
    document.body.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'p',
      bubbles: true,
    }));

    expect(mockNavigateTo).toHaveBeenCalledWith(routes.productsNew());
  });

  // TODO: test show login dialog

  it('fill email and password input', async () => {
    const component = mount(LoginForm, {
      global: {
        stubs: {
          NuxtLink: true,
        },
      },
    });

    const email = 'maimai@gmail.com';
    const password = '123456789';

    const emailInput = component.find('[name="email"]');
    const passwordInput = component.find('[name="password"]');

    await emailInput.setValue(email);
    await passwordInput.setValue(password);

    expect((emailInput.element as HTMLInputElement).value).toBe(email);
    expect((passwordInput.element as HTMLInputElement).value).toBe(password);
  });

  it('alerts user when password is incorrect', async () => {
    const unauthorizedError = new FetchError('Unauthorized');
    unauthorizedError.status = 401;
    loginMock.mockRejectedValueOnce(unauthorizedError);

    const component = await mountSuspended(LoginForm, {
      global: {
        stubs: {
          NuxtLink: true,
        },
      },
    });

    await component.find('[name="email"]').setValue('seller@example.com');
    await component.find('[name="password"]').setValue('Valid1!Pass');
    await component.find('form').trigger('submit');
    await flushPromises();

    expect(loginMock).toHaveBeenCalledWith({
      email: 'seller@example.com',
      password: 'Valid1!Pass',
    });
    expect(component.html()).toContain('Incorrect email or password');
  });

  // TODO: test login success
});
