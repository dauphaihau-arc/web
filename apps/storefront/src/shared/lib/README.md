# `shared/lib`

This folder is for external library wiring and adapters used by the storefront app.

What belongs here:
- wrappers around external packages
- centralized client configuration
- thin adapter code that translates app hooks into a library interface

What does not belong here:
- market-specific logic
- store-owned helpers
- domain rules or feature utilities

Example:
- `api-client.ts` configures the shared API client used by storefront

Put market-owned helpers beside the market module instead of here.
