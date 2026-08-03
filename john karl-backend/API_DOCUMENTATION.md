# API Documentation

Base path: `/api/v1`

Interactive schemas are generated from source annotations:

- Swagger UI: `/docs`
- OpenAPI JSON: `/docs.json`
- Postman: `postman/john-karle-backend.postman_collection.json`

## Authentication

Protected routes require `Authorization: Bearer <access-token>`. `Admin` includes `admin` and `super_admin`; `Super admin` means only `super_admin`.

## Public and Authentication Routes

| Method | Path                                | Access |
| ------ | ----------------------------------- | ------ |
| GET    | `/health`, `/api/v1/health`         | Public |
| POST   | `/auth/register`                    | Public |
| POST   | `/auth/login`                       | Public |
| POST   | `/auth/refresh`                     | Public |
| POST   | `/auth/forgot-password`             | Public |
| POST   | `/auth/forgot-password/verify-code` | Public |
| POST   | `/auth/forgot-password/reset`       | Public |
| GET    | `/auth/me`                          | Bearer |
| POST   | `/auth/logout`                      | Bearer |

## User and Family Routes

| Method    | Path                                       | Access                  |
| --------- | ------------------------------------------ | ----------------------- |
| POST      | `/users/invitations/accept`                | Public invitation token |
| GET/PATCH | `/users/profile`                           | Bearer                  |
| GET       | `/users/family-members`                    | Bearer                  |
| GET/POST  | `/users/invitations`                       | Bearer                  |
| POST      | `/users/invitations/:invitationId/accept`  | Bearer                  |
| POST      | `/users/invitations/:invitationId/decline` | Bearer                  |

## Trusted Contacts and Legacy Access

| Method       | Path                                        | Access |
| ------------ | ------------------------------------------- | ------ |
| GET          | `/trusted-contacts/invite/:token`           | Public |
| POST         | `/trusted-contacts/invite/:token/accept`    | Public |
| POST         | `/trusted-contacts/invite/:token/decline`   | Public |
| POST/GET     | `/trusted-contacts`                         | Bearer |
| GET          | `/trusted-contacts/invitations`             | Bearer |
| POST         | `/trusted-contacts/invitations/:id/accept`  | Bearer |
| POST         | `/trusted-contacts/invitations/:id/decline` | Bearer |
| PATCH/DELETE | `/trusted-contacts/:id`                     | Bearer |
| PATCH        | `/legacy-access/settings`                   | Bearer |
| GET          | `/legacy-access/requests`                   | Bearer |
| POST         | `/legacy-access/:requestId/claim`           | Bearer |
| GET          | `/legacy-access/:requestId/data`            | Bearer |
| POST         | `/legacy-access/:requestId/cancel`          | Bearer |

## Memory, Notification, and Feedback Routes

| Method           | Path                                  | Access                     |
| ---------------- | ------------------------------------- | -------------------------- |
| GET/POST         | `/memory-vault`                       | Bearer; POST is multipart  |
| GET              | `/memory-vault/timeline`              | Bearer                     |
| GET/PATCH/DELETE | `/memory-vault/:memoryId`             | Bearer; PATCH is multipart |
| GET              | `/memory-vault/:memoryId/quote`       | Bearer                     |
| POST             | `/memory-chat`                        | Bearer                     |
| GET              | `/notifications`                      | Bearer                     |
| GET              | `/notifications/unread-count`         | Bearer                     |
| PATCH            | `/notifications/read-all`             | Bearer                     |
| PATCH            | `/notifications/:notificationId/read` | Bearer                     |
| DELETE           | `/notifications/:notificationId`      | Bearer                     |
| POST             | `/report-feedback`                    | Bearer; multipart optional |
| GET              | `/report-feedback/my`                 | Bearer                     |
| GET              | `/report-feedback/:reportId`          | Bearer                     |
| POST             | `/report-feedback/:reportId/replies`  | Bearer; multipart optional |

## Admin Routes

All paths require a bearer token.

| Method           | Path                                       | Role        |
| ---------------- | ------------------------------------------ | ----------- |
| GET              | `/admin/dashboard/metrics`                 | Admin       |
| GET              | `/admin/dashboard/recent-activities`       | Admin       |
| GET              | `/admin/users`                             | Admin       |
| GET              | `/admin/users/:userId`                     | Admin       |
| POST             | `/admin/admins`                            | Super admin |
| POST             | `/admin/bulk-email`                        | Admin       |
| POST/GET         | `/admin/email-templates`                   | Admin       |
| GET/PATCH/DELETE | `/admin/email-templates/:templateId`       | Admin       |
| POST             | `/admin/notifications/broadcast`           | Admin       |
| GET              | `/admin/report-feedback`                   | Admin       |
| GET              | `/admin/report-feedback/:reportId`         | Admin       |
| POST             | `/admin/report-feedback/:reportId/replies` | Admin       |
| PATCH            | `/admin/report-feedback/:reportId/status`  | Admin       |
| GET/PATCH        | `/admin/profile`                           | Admin       |
| PATCH            | `/admin/profile/password`                  | Admin       |
| GET              | `/admin/settings`                          | Admin       |
| PATCH            | `/admin/settings`                          | Super admin |

## Contract Maintenance

For every route change, update the route and validation, implementation, matching `*.swagger.ts`, Postman collection, and route/service tests.
