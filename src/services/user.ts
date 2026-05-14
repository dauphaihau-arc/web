import type { MutationOptions } from '@tanstack/vue-query';
import { RESOURCES } from '~/config/enums/resources';
import type { User, UpdateUserBody } from '~/types/user';
import type { ResponseBaseGetList, RequestGetListParams } from '~/types/common';
import type { CreateBodyUserAddressBody, UserAddress } from '~/types/user-address';
import type { UserAuthenticated } from '~/types/auth';
import { toastCustom } from '~/config/toast';

export function useGetCurrentUser() {
  return useQuery({
    enabled: false,
    queryKey: ['current-user'],
    queryFn: async () => {
      const user = await useCustomFetch.get<UserAuthenticated>(
        `${RESOURCES.AUTH}/me`
      );

      return { user };
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationKey: ['update-user'],
    mutationFn: async (body: UpdateUserBody) => {
      return await useCustomFetch.patch<{ user: User }>(
        RESOURCES.USER,
        body
      );
    },
    onSuccess: (data) => {
      if (data?.user) {
        queryClient.setQueryData(['current-user'], { user: data.user });
      }
    },
    onError: () => {
      toast.add({
        ...toastCustom.error,
        title: 'Update user failed',
      });
    },
  });
}

export function useGetUserAddresses(queryParams?: RequestGetListParams) {
  return useQuery({
    enabled: !!queryParams,
    queryKey: ['get-user-addresses', queryParams],
    queryFn: () => {
      return useCustomFetch.get<ResponseBaseGetList<UserAddress>>(
        `${RESOURCES.USER}${RESOURCES.ADDRESSES}`,
        queryParams || undefined
      );
    },
  });
}

export function useCreateUserAddress() {
  return useMutation({
    mutationKey: ['create-user-address'],
    mutationFn: async (body: CreateBodyUserAddressBody) => {
      return await useCustomFetch.post<{ address: UserAddress }>(
        `${RESOURCES.USER}${RESOURCES.ADDRESSES}`,
        body
      );
    },
  });
}

export function useUpdateUserAddress() {
  return useMutation({
    mutationKey: ['update-user-address'],
    mutationFn: async (body: Partial<UserAddress>) => {
      const { id, ...resBody } = body;
      return await useCustomFetch.patch<{ address: UserAddress }>(
        `${RESOURCES.USER}${RESOURCES.ADDRESSES}/${id}`,
        resBody
      );
    },
  });
}

export function useDeleteUserAddress(
  options?: MutationOptions<unknown, unknown, UserAddress['id'], unknown>
) {
  return useMutation({
    mutationKey: ['delete-user-address'],
    mutationFn: async (id: UserAddress['id']) => {
      return await useCustomFetch.delete(
        `${RESOURCES.USER}${RESOURCES.ADDRESSES}/${id}`
      );
    },
    ...options,
  });
}
