# Environment Variables

Copy `.env.example` to `.env`. `.env` is ignored by Git and must never contain credentials intended for sharing.

## Runtime and Database

| Variable       | Default                 | Purpose                                |
| -------------- | ----------------------- | -------------------------------------- |
| `NODE_ENV`     | `development`           | `development`, `test`, or `production` |
| `PORT`         | `5200`                  | HTTP listening port                    |
| `LOG_LEVEL`    | `info`                  | Pino log level                         |
| `MONGODB_URI`  | Local MongoDB           | MongoDB connection string              |
| `CORS_ORIGIN`  | `*`                     | `*` or comma-separated allowed origins |
| `APP_BASE_URL` | `http://localhost:3000` | Frontend URL used in links             |

## Authentication and Seed User

| Variable                 | Default          | Purpose                                   |
| ------------------------ | ---------------- | ----------------------------------------- |
| `JWT_SECRET`             | Development-only | JWT signing secret; replace in production |
| `JWT_ACCESS_EXPIRES_IN`  | `15m`            | Access-token lifetime                     |
| `JWT_REFRESH_EXPIRES_IN` | `30d`            | Refresh-token lifetime                    |
| `BCRYPT_SALT_ROUNDS`     | `12`             | Password hashing cost                     |
| `SUPER_ADMIN_NAME`       | `Super Admin`    | Initial super-admin name                  |
| `SUPER_ADMIN_EMAIL`      | Empty            | Enables seed with password                |
| `SUPER_ADMIN_PASSWORD`   | Empty            | Initial super-admin password              |

## Mail and Password Reset

| Variable                               | Default       | Purpose              |
| -------------------------------------- | ------------- | -------------------- |
| `GMAIL_EMAIL`                          | Empty         | Gmail SMTP account   |
| `GMAIL_APP_PASSWORD`                   | Empty         | Gmail app password   |
| `MAIL_FROM_NAME`                       | `John Karle`  | Sender display name  |
| `MAIL_REPLY_TO`                        | Gmail address | Reply-to address     |
| `PASSWORD_RESET_CODE_EXPIRES_MINUTES`  | `10`          | Code lifetime        |
| `PASSWORD_RESET_TOKEN_EXPIRES_MINUTES` | `15`          | Reset-token lifetime |

## AWS S3

| Variable                | Default | Purpose       |
| ----------------------- | ------- | ------------- |
| `AWS_REGION`            | Empty   | Bucket region |
| `S3_BUCKET_NAME`        | Empty   | Upload bucket |
| `AWS_ACCESS_KEY_ID`     | Empty   | S3 credential |
| `AWS_SECRET_ACCESS_KEY` | Empty   | S3 credential |

## Legacy Access

| Variable                                        | Default | Purpose                 |
| ----------------------------------------------- | ------- | ----------------------- |
| `LEGACY_ACCESS_INVITE_EXPIRES_HOURS`            | `72`    | Invite lifetime         |
| `LEGACY_ACCESS_WAITING_DAYS`                    | `14`    | Access waiting period   |
| `LEGACY_ACCESS_REQUEST_TTL_DAYS`                | `44`    | Request lifetime        |
| `LEGACY_ACCESS_JOB_INTERVAL_HOURS`              | `24`    | Scheduler interval      |
| `LEGACY_ACCESS_ACTIVITY_TOUCH_INTERVAL_MINUTES` | `5`     | Activity-write throttle |
| `LEGACY_ACCESS_JOB_ENABLED`                     | `true`  | Enables scheduler       |

## Production Rules

- Use a unique high-entropy `JWT_SECRET`.
- Restrict `CORS_ORIGIN` to deployed origins.
- Use least-privilege MongoDB and S3 identities.
- Store secrets in the hosting provider's secret manager.
- Rotate any credential exposed in chat, logs, screenshots, or Git history.
