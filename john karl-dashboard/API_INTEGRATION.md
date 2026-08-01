# API Integration

## Base URL

`lib/api.ts` reads:

```env
NEXT_PUBLIC_API_URL=http://localhost:5200/api/v1
```

If unset, the application falls back to the configured hosted backend URL in source. Set the variable explicitly in every deployment.

## Contract

Standard success:

```json
{ "success": true, "message": "Operation completed.", "data": {} }
```

Paginated responses include `meta`. RTK Query transforms these envelopes into UI-friendly values.

## Integrated Endpoints

| Area          | Backend endpoints                                    |
| ------------- | ---------------------------------------------------- |
| Auth          | Login, current user, logout, refresh, password reset |
| Dashboard     | Admin metrics and recent activities                  |
| Users         | Admin user list and details                          |
| Admins        | Create admin                                         |
| Email         | Templates and bulk email                             |
| Profile       | Read/update profile and change password              |
| Settings      | Read/update admin settings                           |
| Reports       | Admin report list, details, and status               |
| Notifications | List, unread count, mark read/all read, delete       |

All protected requests receive `Authorization: Bearer <access-token>`.

## Adding an Endpoint

1. Add or update shared types in `lib/types.ts`.
2. Add the RTK Query endpoint in `lib/api.ts`.
3. Transform the backend envelope rather than leaking it into components.
4. Add precise `providesTags` or `invalidatesTags`.
5. Export the generated hook.
6. Use the hook in an extracted feature component.
7. Handle loading, empty, error, success, and permission states.
8. Verify the backend Swagger/Postman contract.

## Error Handling

Use `getApiErrorMessage` for user-safe server messages. Do not display tokens, stack traces, raw HTML, or private response content. On `401`, the shared base query handles one refresh and retry; components should not implement separate refresh logic.
