# Arc
A ecommerce marketplace web application  where people come together to make, sell, buy, and collect unique items

## Tech stack

- [Nuxt.js](https://nuxt.com/) - Vue Framework
- [Vue Query](https://tanstack.com/query/latest/docs/framework/vue/overview) - Managing and caching asynchronous data
- [Pinia](https://pinia.vuejs.org/) - State management
- [Typescript](https://www.typescriptlang.org/) - Static Type Checking
- [Tailwind](https://tailwindcss.com/) - Utility-first CSS framework
- [Zod](https://zod.dev/) - TypeScript-first schema declaration and validation
- [Vitest](https://vitest.dev/) - Testing Framework

## Rendering and session recovery

- Home uses one-hour ISR; other public routes retain the five-minute ISR default.
- Category listings (`/c/**`) and search use uncached SSR so market and filter results are not shared through ISR.
- Success, guest orders, cart, checkout, account, orders, and password reset remain client-rendered with ISR and Nitro caching explicitly disabled.
- Both current-user API methods enable refresh/retry in the browser. Recoverable access-token errors use the shared API client's cookie refresh flow before retrying the lookup; rejected refreshes leave the guest lookup unauthenticated.
- Current-user requests do not refresh during SSR. This does not add server-side session rotation or cookie forwarding.

## Installation Guide

1. **Clone the GitHub repository**
```bash
https://github.com/dauphaihau/arc-fe.git
```
2. **Install dependencies**
```bash
pnpm install
```
3. **Copy .env.example to .env and update the variables**

4. **Launches a dev server**
```bash
pnpm dev
```
