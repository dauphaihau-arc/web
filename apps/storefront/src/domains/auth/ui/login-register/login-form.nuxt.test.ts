import { mountSuspended } from '@nuxt/test-utils/runtime';
import { flushPromises, mount } from '@vue/test-utils';
import { FetchError } from 'ofetch';
import {
  beforeEach, describe, expect, it, vi,
} from 'vitest';
import LoginForm from './login-form.vue';

const {
  loginMock,
  authClientConfigLoading,
  loginState,
} = vi.hoisted(() => ({
  loginMock: vi.fn(),
  authClientConfigLoading: { value: false },
  loginState: { isPending: false },
}));

vi.mock('~/domains/auth/mutations/login.mutation', () => ({
  useLogin: () => ({
    mutateAsync: loginMock,
    isPending: loginState.isPending,
  }),
}));

vi.mock('~/domains/auth/queries/client-config.query', () => ({
  useAuthClientConfig: () => ({
    data: { value: undefined },
    isLoading: authClientConfigLoading.value,
  }),
}));

describe('login form', () => {
  beforeEach(() => {
    loginMock.mockReset();
    authClientConfigLoading.value = false;
    loginState.isPending = false;
  });

  it('fills email and password input', async () => {
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

    await component.find('[name="email"]').setValue('customer@example.com');
    await component.find('[name="password"]').setValue('Valid1!Pass');
    await component.find('form').trigger('submit');
    await flushPromises();

    expect(loginMock).toHaveBeenCalledWith({
      email: 'customer@example.com',
      password: 'Valid1!Pass',
    });
    expect(component.html()).toContain('Incorrect email or password');
  });

  it('keeps submit disabled instead of spinning while the auth config loads', () => {
    authClientConfigLoading.value = true;

    const component = mount(LoginForm, {
      global: {
        stubs: {
          NuxtLink: true,
        },
      },
    });

    const submit = component.find('[data-testid="login-submit"]');

    expect(submit.attributes('disabled')).toBeDefined();
    expect(submit.find('.animate-spin').exists()).toBe(false);
  });

  it('blocks the forgot password link and inputs while the login request is in flight', async () => {
    loginState.isPending = true;

    const component = await mountSuspended(LoginForm);
    const resetLink = component.find('a[href*="reset"]');
    const inputs = component.findAll('input');

    expect(resetLink.attributes('aria-disabled')).toBe('true');
    expect(resetLink.attributes('tabindex')).toBe('-1');
    expect(inputs.every(input => input.attributes('disabled') !== undefined)).toBe(true);
  });
});
