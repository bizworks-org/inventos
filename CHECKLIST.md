# Deployment Checklist (minimal)

A simple checklist to verify the app before deploying to a VM or running locally.

- Application

  - [ ] `NODE_ENV` set to `production` in production environment
  - [ ] Build the app: `npm run build` succeeds
  - [ ] Start the app: `npm start` or `npm run start` works

- Environment variables

  - [ ] Database connection variables (`DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`) configured
  - [ ] `BLOB_READ_WRITE_TOKEN` set if using Vercel Blob in production
  - [ ] Mail settings (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`) configured if sending email
  - [ ] Any `NEXT_PUBLIC_*` keys required by the frontend are present

- Storage & uploads

  - [ ] `public/uploads/` exists and is writable when running locally
  - [ ] `.gitignore` contains `public/uploads/` to avoid committing uploads

- Database

  - [ ] Run migrations: ensure `db/migrations/*` applied to the DB
  - [ ] Test connectivity from the host to the DB

- Security

  - [ ] Secrets not checked into repo (`passwords.txt` removed or secured)
  - [ ] TLS / HTTPS configured for production

- Health checks & monitoring

  - [ ] Health endpoint available: `/api/health` returns `ok: true`
  - [ ] Optional: DB health check or storage health endpoint added if desired

- Optional smoke tests
  - [ ] Sign in flow works (manual or automated)
  - [ ] Basic CRUD on assets works
