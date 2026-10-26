# spoki-odoo

Odoo module for the Spoki WhatsApp Chat & Voice integration.

[`spoki_whatsapp/`](spoki_whatsapp/) adds an **Open Spoki Chat** button on the contact (`res.partner`) form. It opens Spoki's
embedded chat for WhatsApp messages and voice calls. An administrator connects the database once from
**Settings > Spoki > Connect to Spoki**.

- **Data-only module (no Python):** installs on Odoo Online, Odoo.sh and on-premise, Community and Enterprise.
- **Target Odoo:** 19.0 and saas~19.x (Owl 3), 18.0.
- **Backend contract:** `/odoo/v1/` on spoki-be, see `docs/integrations/odoo-embed-contract.md` in spoki-app (section 9 for the connect popup).

## Branches

One branch per Odoo version, as the Odoo Apps Store requires: `19.0`, `18.0`, `17.0` (see Release for the small
per-branch differences).

## Layout

```
spoki_whatsapp/
├── __manifest__.py
├── data/server_actions.xml       # config read (all users) + connection save (admins), no Python
├── views/                        # contact form button + Settings > Spoki page
└── static/
    ├── description/              # Apps Store page: icon, index.html, screenshots
    └── src/spoki_chat_button/    # OWL widgets, HMAC signing, connect popup
```

## Build

```bash
./scripts/build.sh
```

Writes `out/spoki_whatsapp-<version>.zip`, importable from **Apps > Import Module** (developer mode). Customers get the same
zip from the **Download** button on the Odoo Apps Store page.

## Release

1. Bump `version` in `__manifest__.py`. Keep it short (`1.0.1`): Odoo Online rejects a version prefixed with another series.
2. Port the change to `19.0`, `18.0` and `17.0`. Keep the per-branch differences: `groups_id` instead of `group_ids` in
   `data/server_actions.xml` on 18.0 and 17.0, and `jsonrpc as rpc` from `@web/core/network/rpc_service` on 17.0.
3. Click **Scan** on the repository at apps.odoo.com/apps/dashboard/repos (daily scan is off), then bump
   `SPOKI_ODOO_VERSION` / `SPOKI_ODOO_RELEASE_DATE` in spoki-fe `OdooIntegrationDetails.tsx`. The install button links to
   the store listing, so there is no zip to upload.

## Gotchas

- Templates must use `this.state` / `this.method` / `t-out`: saas~19.x runs Owl 3, where plain `state.` crashes the form.
  A local `odoo:19.0` (Owl 2) does not catch this, so smoke test on a saas database.
- Asset paths in `__manifest__.py` are listed one by one: imported modules refuse glob patterns.
- Inherited views cannot carry `group_ids`; put `groups` on the element instead.
