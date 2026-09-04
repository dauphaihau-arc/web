# Domain Shared

`_shared/` contains app-specific support code used by multiple domains, but not owned by one business domain.

Use this folder when a module must live in the domain layer because domain APIs depend on it, while the module also wires domain behavior such as auth, market, or session policy.

Keep generic, domain-agnostic utilities in `src/shared/`. Keep route composition and app bootstrapping in `src/app/`.
