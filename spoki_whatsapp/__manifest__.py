{
    "name": "Spoki - WhatsApp Chat & Voice",
    "version": "1.0.0",
    "summary": "Open Spoki's embedded WhatsApp chat and voice calls from any contact.",
    "description": """
Spoki for Odoo
==============

Adds an "Open Spoki Chat" button on the contact form that opens Spoki's embedded
chat for WhatsApp messages and voice calls, without leaving Odoo.

Data-only module (no Python), so it also runs on Odoo Online. An administrator
connects it once from Settings > Spoki > Connect to Spoki.
""",
    "author": "Spoki",
    "website": "https://spoki.com",
    "category": "Sales/CRM",
    "license": "LGPL-3",
    "depends": ["base", "web"],
    "data": [
        "data/server_actions.xml",
        "views/res_partner_views.xml",
        "views/res_config_settings_views.xml",
    ],
    "assets": {
        "web.assets_backend": [
            "spoki_whatsapp/static/src/spoki_chat_button/spoki_config.js",
            "spoki_whatsapp/static/src/spoki_chat_button/spoki_signing.js",
            "spoki_whatsapp/static/src/spoki_chat_button/spoki_chat_button.js",
            "spoki_whatsapp/static/src/spoki_chat_button/spoki_chat_button.xml",
            "spoki_whatsapp/static/src/spoki_chat_button/spoki_chat_button.css",
            "spoki_whatsapp/static/src/spoki_chat_button/spoki_connect.js",
            "spoki_whatsapp/static/src/spoki_chat_button/spoki_connect.xml",
        ],
    },
    "images": ["static/description/spoki_odoo_result_screenshot.jpg"],
    "application": False,
    "installable": True,
    "auto_install": False,
}
