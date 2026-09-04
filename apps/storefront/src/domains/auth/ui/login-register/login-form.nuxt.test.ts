import { mountSuspended } from '@nuxt/test-utils/runtime';
import { flushPromises, mount } from '@vue/test-utils';
import { FetchError } from 'ofetch';
import {
  beforeEach, describe, expect, it, vi,
} from 'vitest';
import LoginForm from './login-form.vue';

const {
  loginMock,
} = vi.hoisted(() => ({
  loginMock: vi.fn(),
}));

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

describe('login form', () => {
  beforeEach(() => {
    loginMock.mockReset();
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
});
