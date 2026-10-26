# spoki-odoo

Odoo module for the Spoki WhatsApp Chat & Voice integration.

[`spoki_whatsapp/`](spoki_whatsapp/) adds an **Open Spoki Chat** button on the contact (`res.partner`) form. It opens Spoki's
embedded chat for WhatsApp messages and voice calls. An administrator connects the database once from
**Settings > Spoki > Connect to Spoki**.

- **Data-only module (no Python):** installs on Odoo Online, Odoo.sh and on-premise, Community and Enterprise.
- **Target Odoo:** 19.0 and saas~19.x (Owl 3), 18.0.
- **Backend contract:** `/odoo/v1/` on spoki-be, see `docs/integrations/odoo-embed-contract.md` in spoki-app (section 9 for the connect popup).

## Branches

One branch per Odoo version, as the Odoo Apps Store requires: `19.0`, `18.0`. The module is the same on both.

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

Writes `out/spoki_whatsapp-<version>.zip`, importable from **Apps > Import Module** (developer mode) and uploaded to the
public S3 bucket used by the download button in Spoki.

## Release

1. Bump `version` in `__manifest__.py`. Keep it short (`1.0.1`): Odoo Online rejects a version prefixed with another series.
2. Merge into `19.0` and `18.0`; the Odoo Apps Store rescans the branches.
3. Run `./scripts/build.sh`, upload the zip to `media/integrations/odoo/<version>/spoki_whatsapp.zip` and bump
   `SPOKI_ODOO_VERSION` / `SPOKI_ODOO_INSTALL_URL` in spoki-fe `OdooIntegrationDetails.tsx`.

## Gotchas

- Templates must use `this.state` / `this.method` / `t-out`: saas~19.x runs Owl 3, where plain `state.` crashes the form.
  A local `odoo:19.0` (Owl 2) does not catch this, so smoke test on a saas database.
- Asset paths in `__manifest__.py` are listed one by one: imported modules refuse glob patterns.
- Inherited views cannot carry `group_ids`; put `groups` on the element instead.
