<script setup lang="ts">
import { ROUTES } from '~/shared/config/enums/routes'
import { useGetCurrentUser } from '~/shared/services/user'

const { data: dataUserAuth } = useGetCurrentUser()
</script>

<template>
  <div>
    <UPopover>
      <UTooltip text="Your account">
        <UButton
          color="gray"
          variant="ghost"
        >
          <Icon
            name="uil:user"
            color="black"
          />
        </UButton>
      </UTooltip>
      <template #panel="{ close }">
        <div
          class="flex flex-col p-2"
          @click="close"
        >
          <UButton
            color="gray"
            variant="ghost"
            :to="ROUTES.ACCOUNT"
          >
            <div class="flex items-center gap-3">
              <img
                src="~/app/assets/images/avatar-default.jpg"
                class="size-5 rounded-full"
                alt="avatar"
              >
              <div class="text-left">
                <div>
                  {{ dataUserAuth?.user?.name }}
                </div>
                <div class="text-xs text-zinc-500/70">
                  View your profile
                </div>
              </div>
            </div>
          </UButton>
          <!--          <UButton -->
          <!--            id="logout" -->
          <!--            color="gray" -->
          <!--            variant="ghost" -->
          <!--            @click="authStore.logout()" -->
          <!--          > -->
          <!--            <div class="flex gap-3"> -->
          <!--              <Icon -->
          <!--                name="oi:account-logout" -->
          <!--                color="black" -->
          <!--              /> -->
          <!--              Logout -->
          <!--            </div> -->
          <!--          </UButton> -->
        </div>
      </template>
    </UPopover>
  </div>
</template>
