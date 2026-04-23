# n8n integration

Visual workflow automation for the Goldenray stack. The in-process `node-cron`
scheduler still handles the core always-on jobs (overdue tasks, stock, lead
scoring). n8n sits on top for anything visual, multi-step, or third-party
(Slack, Google Sheets, Xero, MailChimp, HubSpot, Make, Airtable, etc.).

## Run locally

```bash
docker compose -f docker-compose.n8n.yml up -d
open http://localhost:5678
```

Default creds: **admin / goldenray** (change in `docker-compose.n8n.yml`).

## Event flow

### Outbound — Goldenray fires events TO n8n

Enable by setting these in `.env` and restarting the server:

```env
N8N_WEBHOOK_URL=http://localhost:5678
N8N_WEBHOOK_SECRET=<some-random-string>
```

When set, the server POSTs this payload to
`{N8N_WEBHOOK_URL}/webhook/goldenray/{event}` with an
`X-Goldenray-Signature` HMAC header:

| Event             | Fires when…                                           |
|-------------------|-------------------------------------------------------|
| `order.placed`    | `/api/orders` POST succeeds                           |
| `enquiry.submitted` | `/api/quote/submit` (free-quote form)               |
| `product.enquiry` | `/api/product-enquiry` submit                         |
| `finance.applied` | `/api/finance/apply` submit                           |
| `bill.uploaded`   | `/api/powerbill/upload` processes a bill              |

In n8n, add a **Webhook trigger** with path `goldenray/{event-with-hyphens}` —
e.g. `goldenray/order-placed`.

### Inbound — n8n calls Goldenray

n8n workflows can hit these endpoints (signed with the same secret):

| Endpoint                              | Purpose                                                     |
|---------------------------------------|-------------------------------------------------------------|
| `GET  /webhooks/n8n/status`           | Ping + config check                                         |
| `POST /webhooks/n8n/query`            | Run light SELECT on allow-listed tables                     |
| `POST /webhooks/n8n/contact`          | Upsert a contact (matched by email)                         |
| `POST /webhooks/n8n/activity`         | Log an activity to the CRM feed                             |
| `POST /webhooks/n8n/order-status`     | Update an order (e.g. Xero paid → mark-paid)                |
| `POST /webhooks/n8n/job/:name`        | Trigger any of the 9 cron jobs manually                     |
| `GET  /webhooks/n8n/events/since`     | Polling — records created since `?since=ISO`                |

## Sample workflows (importable)

Three starter workflows in `n8n/workflows/`:

1. **`01-new-order-slack.json`** — every new order fires a Slack message with
   order number + total + customer name.
2. **`02-daily-digest-slack.json`** — at 08:15 NZ n8n calls
   `/webhooks/n8n/job/digest`, summarises the result, posts to Slack.
3. **`03-bill-upload-to-sheets.json`** — appends every bill upload to a
   Google Sheet, and for uploads with annual savings > $1,500 logs a
   "High-value lead" activity back to the CRM.

To import, in n8n UI go to **Workflows → Import from file** and pick the JSON.
Replace `REPLACE_ME` Slack/Sheets placeholders before activating.

## Why keep both cron + n8n?

- **cron** runs inside the Node process — zero latency, no extra infra, survives
  n8n being offline. Ideal for DB housekeeping + required business logic.
- **n8n** is for operator-facing automations that need Slack/Sheets/Xero/etc.,
  visual editing, or audit trails of each run.

Disable everything by clearing `N8N_WEBHOOK_URL` from `.env`; all dispatch
becomes a silent no-op.
