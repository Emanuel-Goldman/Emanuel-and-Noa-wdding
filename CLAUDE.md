# Fullstack Web Guardrails

Use these rules when building full-stack web applications. The expected stack is React with strict TypeScript, FastAPI with modern Python, Cloud Firestore, Firebase Authentication when needed, Firebase Hosting for the frontend, and Cloud Run for the FastAPI container. Favor clear, tested, secure code over clever or premature abstractions.

## Fail-Fast Rule

- Validate required inputs at system boundaries: forms, API requests, environment configuration, and database documents.
- Reject invalid state with a clear, actionable error instead of silently applying a fallback that changes behavior.
- Do not catch broad exceptions unless adding useful context and re-raising or handling a specific expected failure.
- Treat impossible states as errors and make them unrepresentable with types or schemas when practical.
- Check required environment variables during application startup, not after the first affected request.
- Never ignore a failed network, database, authentication, build, test, or deployment operation.

## Small Functions Rule

- Give each function one clear responsibility and a name that describes its result or effect.
- Keep orchestration separate from calculations, validation, persistence, and presentation.
- Extract a helper when a block has a meaningful name, is reused, or can be tested independently.
- Do not split straightforward logic into tiny indirections that make the call flow harder to follow.
- Prefer explicit parameters and return values over hidden module state or mutation.
- Keep functions short enough that their assumptions, branches, and failure modes can be understood together.

## Code Reuse Rule

- Search for an existing component, hook, utility, service, dependency, or schema before adding a duplicate.
- Keep one authoritative implementation of business rules and validation logic.
- Reuse composition before introducing inheritance or a broad framework abstraction.
- Parameterize real variations instead of copying entire components, routes, or services.
- Share API types through generated clients or an explicit contract workflow rather than manually maintaining look-alike interfaces.
- Do not create a generic abstraction until multiple concrete use cases demonstrate the shared behavior.

## Clear Code Rule

- Prefer descriptive domain names over abbreviations, generic labels, or implementation jargon.
- Make control flow obvious; use early returns to reduce nesting when they improve readability.
- Keep files centered on one feature or responsibility and follow the project's established structure.
- Comment why a non-obvious decision exists, not what plainly readable code does.
- Replace unexplained literals with named constants when the value carries domain meaning.
- Avoid hidden side effects, surprising mutation, and clever expressions that are difficult to debug.
- Preserve the existing formatter, linter, and import conventions rather than creating competing styles.

## TypeScript Rule

- Use TypeScript for frontend application code and keep strict compiler checks enabled.
- Do not use `any` to bypass modeling work; prefer a precise type or `unknown` followed by validation and narrowing.
- Type component props, hook results, service boundaries, and external data explicitly.
- Prefer discriminated unions for state with mutually exclusive cases such as idle, loading, success, and error.
- Avoid unsafe type assertions; validate runtime data before treating it as a trusted type.
- Use generated or shared API types when available and do not duplicate backend schemas by hand without a synchronization check.
- Keep types near their domain owner and export only types that are genuinely shared.

## React Component Rule

- Use function components and hooks; follow the conventions already established by the project.
- Keep components focused on one UI responsibility and extract reusable behavior into hooks or plain functions.
- Prefer composition and explicit props over large components controlled by many boolean flags.
- Keep business and persistence logic out of presentational components.
- Use stable semantic identifiers for list keys; never use an array index when items can reorder, be inserted, or be removed.
- Make loading, empty, error, and success states explicit.
- Do not introduce memoization until a real render or computation cost justifies it.

## React State and Effects Rule

- Store the minimum state needed; derive values during rendering when they can be calculated from props or existing state.
- Keep state close to the components that own it and lift it only when multiple consumers truly need the same source of truth.
- Use Effects to synchronize with external systems, not to reproduce ordinary data flow.
- Declare complete Effect dependencies and restructure unstable logic instead of disabling dependency lint rules.
- Clean up subscriptions, listeners, timers, and in-flight work when an Effect is replaced or a component unmounts.
- Prevent stale responses from overwriting newer state when requests can race.
- Use a consistent data-fetching layer rather than scattering raw fetch and Firestore calls through components.

## Accessibility and Responsive UI Rule

- Use semantic HTML before adding ARIA roles or custom keyboard behavior.
- Give every interactive control an accessible name and ensure it is usable by keyboard.
- Associate form fields with labels and present validation errors in a way assistive technology can discover.
- Preserve visible focus indicators and sufficient color contrast.
- Use responsive layouts that work at narrow and wide viewport sizes without hiding essential actions.
- Respect reduced-motion preferences and avoid motion required to understand or operate the interface.
- Test meaningful user flows by role and accessible name rather than brittle CSS selectors.

## FastAPI and Python Rule

- Use FastAPI for HTTP endpoints and Pydantic models for validated request and response schemas.
- Add Python type hints to public functions, service boundaries, dependencies, and return values.
- Keep route handlers thin: validate and authorize at the boundary, then delegate business logic to services.
- Use FastAPI dependency injection for authentication, configuration, and replaceable service dependencies.
- Use `async def` only when awaiting non-blocking I/O; do not call blocking libraries from the event loop.
- Return deliberate HTTP status codes and stable error shapes; do not expose raw internal exceptions.
- Keep database and Firebase Admin SDK access behind focused repository or service interfaces.
- Follow the project's formatter, linter, and type-checker settings; for new projects prefer Ruff and a configured static type checker.

## API Contract Rule

- Define request and response bodies with Pydantic models and expose accurate OpenAPI metadata.
- Treat the API schema as the contract between React and FastAPI.
- Generate TypeScript client types from OpenAPI when practical; do not let handwritten frontend types drift from backend schemas.
- Validate all untrusted data at the boundary, including path, query, header, body, and third-party response data.
- Use consistent JSON naming, timestamp, identifier, pagination, and error conventions.
- Make breaking contract changes explicit and update clients and tests in the same change.
- Do not return Firestore document snapshots or backend implementation objects directly from routes.

## Cloud Firestore Rule

- Design collections and documents around actual query patterns; Firestore is not a relational database.
- Keep document shapes explicit and validate data read from Firestore before using it as trusted application state.
- Store timestamps as Firestore timestamps and define clearly whether they are written by the client or server.
- Avoid unbounded reads and listeners; use filters, limits, cursors, and pagination.
- Use transactions or batched writes when correctness depends on atomic multi-document changes.
- Avoid sequential document IDs and single-document write hotspots in high-write paths.
- Add and version required composite indexes in `firestore.indexes.json`.
- Keep privileged writes on the FastAPI backend with the Firebase Admin SDK when client security rules cannot express the required policy safely.
- Account for read, write, storage, and listener costs when choosing a data model.

## Firebase Security Rule

- Deny access by default in Firestore and Storage Security Rules, then grant only the minimum required operations.
- Treat client input and client-side role checks as untrusted; enforce authorization in Security Rules or trusted FastAPI code.
- Verify Firebase ID tokens on protected backend endpoints and derive identity from the verified token, never from a submitted user ID.
- Check resource ownership, allowed fields, data types, and immutable fields in Firestore Security Rules.
- Never use permissive production rules such as unconditional `allow read, write: if true`.
- Test allowed and denied operations with the Firebase Emulator Suite and `@firebase/rules-unit-testing`.
- Keep development, staging, and production Firebase projects separate.
- Do not expose service-account keys or Admin SDK credentials to frontend code.

## Firebase Deployment Rule

- Build the React application into a deterministic output directory and deploy that directory with Firebase Hosting.
- Configure an SPA fallback to `index.html` only after more specific static, API, and reserved routes.
- Deploy FastAPI as a container to Cloud Run; route `/api/**` through a Firebase Hosting rewrite when a shared origin is desired.
- Make the FastAPI container listen on the `PORT` environment variable supplied by Cloud Run.
- Keep Firebase project aliases and environment-specific configuration explicit; verify the active project before deployment.
- Use Hosting preview channels or an equivalent staging environment before production deployment.
- Run formatting, type checks, tests, frontend build, and backend container checks before deploying.
- Apply least-privilege service identities, bounded Cloud Run scaling, and explicit region choices.
- Keep `firebase.json`, `.firebaserc`, Firestore rules, indexes, and deployment workflows version-controlled.

## Testing Rule

- Add or update tests whenever behavior changes or a bug is fixed.
- Test observable behavior and contracts rather than private implementation details.
- Use Vitest and React Testing Library for frontend unit and component tests.
- Prefer user-centered queries such as role, label, and visible text over test IDs or CSS selectors.
- Use pytest with FastAPI `TestClient` or HTTPX for backend routes, services, validation, authentication, and error cases.
- Test Firestore and Authentication integration against the Firebase Local Emulator Suite, never production data.
- Test Firestore Security Rules with `@firebase/rules-unit-testing`, including both allowed and denied operations.
- Mock only external boundaries; avoid mocks that merely repeat the implementation.
- Keep tests deterministic, isolated, and safe to run in any order.
- Do not call work complete while relevant tests, type checks, or builds are failing.

## Errors and Observability Rule

- Show users concise, actionable errors without exposing stack traces, credentials, internal paths, or database details.
- Preserve the original exception as the cause when adding backend context.
- Log structured context such as operation, request ID, actor ID when safe, and relevant resource identifiers.
- Never log passwords, authorization headers, ID tokens, session cookies, service-account keys, or sensitive document contents.
- Distinguish validation, authentication, authorization, not-found, conflict, dependency, and internal failures.
- Add frontend error boundaries around meaningful application regions and provide a recovery path.
- Use timeouts and deliberate retry policies for network calls; retry only failures that may safely succeed later.
- Make health and readiness behavior sufficient to diagnose deployment failures without revealing sensitive information.

## Secrets and Configuration Rule

- Never commit secrets, private keys, tokens, production credentials, or populated environment files.
- Treat frontend environment variables as public because they are bundled into client code.
- Keep server secrets in an approved secret manager or protected deployment environment, not source code.
- Provide a safe `.env.example` containing names and documentation but no secret values.
- Validate required backend configuration at startup with a typed settings layer.
- Keep local, test, staging, and production configuration separate and explicit.
- Use the normal Firebase web configuration in the frontend only with restrictive Security Rules and authorized-domain settings; it is not a substitute for authorization.
- Rotate and revoke a credential immediately if it is exposed.

## Performance and Dependencies Rule

- Measure a real bottleneck before making performance-driven changes.
- Avoid unnecessary React renders, repeated network requests, unbounded Firestore listeners, and repeated expensive transformations.
- Paginate large results and load code or data incrementally when it materially improves user experience.
- Keep the frontend bundle intentional; prefer platform features and existing dependencies over adding a package for trivial behavior.
- Add dependencies only when their maintenance, security, bundle, and operational costs are justified.
- Pin or lock dependency versions through the project's package and Python dependency tooling.
- Do not perform blocking I/O in FastAPI async routes.
- Set explicit timeouts and resource limits for external calls and deployed services.
- Preserve readability unless measurement shows that a less obvious optimization is necessary.