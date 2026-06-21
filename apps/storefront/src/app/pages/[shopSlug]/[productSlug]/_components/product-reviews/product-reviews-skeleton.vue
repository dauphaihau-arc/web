<template>
  <section
    id="reviews"
    class="space-y-6 py-10"
    aria-busy="true"
    aria-live="polite"
  >
    <div class="space-y-5">
      <USkeleton class="h-8 w-48 !bg-customGray-300/85" />
      <div class="flex items-center gap-4">
        <div class="flex gap-3">
          <USkeleton class="h-12 w-16 !bg-customGray-300/85" />
          <USkeleton class="size-8 rounded-full !bg-customGray-300/85" />
        </div>
        <div class="space-y-2">
          <USkeleton class="h-5 w-28 !bg-customGray-300/85" />
          <USkeleton class="h-4 w-24 !bg-customGray-300/85" />
        </div>
      </div>

      <div class="flex gap-3">
        <USkeleton
          v-for="index in 4"
          :key="index"
          class="h-10 w-24 rounded-full !bg-customGray-300/85"
        />
      </div>
    </div>

    <div class="grid grid-cols-4 gap-4">
      <USkeleton
        v-for="index in 4"
        :key="`review-image-${index}`"
        class="aspect-square w-full rounded-[20px] !bg-customGray-300/85"
      />
    </div>

    <div class="space-y-0">
      <article
        v-for="index in 3"
        :key="`review-${index}`"
        class="border-t border-border-subtle py-4 first:border-t-0 first:pt-0"
      >
        <div class="space-y-4">
          <div class="flex items-start justify-between gap-4">
            <div class="space-y-3">
              <div class="flex items-center gap-3">
                <USkeleton class="h-4 w-24 !bg-customGray-300/85" />
                <USkeleton class="h-6 w-8 !bg-customGray-300/85" />
              </div>
            </div>
            <div class="flex items-center gap-3">
              <USkeleton class="size-7 rounded-full !bg-customGray-300/85" />
              <div class="space-y-2">
                <USkeleton class="h-3 w-24 !bg-customGray-300/85" />
                <USkeleton class="h-3 w-20 !bg-customGray-300/85" />
              </div>
            </div>
          </div>

          <div class="space-y-2">
            <USkeleton class="h-4 w-40 !bg-customGray-300/85" />
            <USkeleton class="h-4 w-full max-w-4xl !bg-customGray-300/85" />
            <USkeleton class="h-4 w-4/5 max-w-3xl !bg-customGray-300/85" />
          </div>
        </div>
      </article>
    </div>
  </section>
</template>
