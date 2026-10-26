/** @odoo-module **/

import { rpc } from "@web/core/network/rpc";

const CONFIG_ACTION_XMLID = "spoki_whatsapp.action_spoki_get_config";
const SAVE_ACTION_XMLID = "spoki_whatsapp.action_spoki_save_connection";

async function runServerAction(xmlid, context = {}) {
    const action = await rpc("/web/action/load", { action_id: xmlid });
    const result = await rpc("/web/action/run", { action_id: action.id, context });
    return (result && result.params) || {};
}

export function loadSpokiConfig() {
    return runServerAction(CONFIG_ACTION_XMLID);
}

export function saveSpokiConnection({ signingKey, baseUrl = "" }) {
    return runServerAction(SAVE_ACTION_XMLID, { spoki_signing_key: signingKey, spoki_base_url: baseUrl });
}
