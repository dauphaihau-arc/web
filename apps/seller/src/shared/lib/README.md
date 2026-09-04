# `shared/lib`

This folder is for external library wiring and adapters used by the seller app.

What belongs here:
- wrappers around external packages
- centralized client configuration
- thin adapter code that translates app hooks into a library interface

What does not belong here:
- domain rules or feature utilities
- store-owned helpers
- route/page composition

Examples:
- `logger.ts` configures the app logger through `consola`
