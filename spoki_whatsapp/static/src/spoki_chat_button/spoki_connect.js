/** @odoo-module **/

import { Component, onWillStart, onWillUnmount, useState } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";
import { standardWidgetProps } from "@web/views/widgets/standard_widget_props";
import { loadSpokiConfig, saveSpokiConnection } from "./spoki_config";

const CONNECT_PATH = "/integrations/odoo/connect";
const CONNECT_WINDOW_NAME = "spokiConnect";
const CONNECT_WINDOW_FEATURES = "popup=yes,width=520,height=720,resizable=yes,scrollbars=yes";
const POPUP_POLL_MS = 500;
const POPUP_CLOSED_GRACE_MS = 1000;
const STATE_BYTES = 16;

export const SpokiConnectMessage = Object.freeze({
    CONNECTED: "spoki:odoo:connected",
    ERROR: "spoki:odoo:error",
});

function randomState() {
    const bytes = new Uint8Array(STATE_BYTES);
    crypto.getRandomValues(bytes);
    return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export class SpokiConnect extends Component {
    static template = "spoki_whatsapp.SpokiConnect";
    static props = { ...standardWidgetProps };

    setup() {
        this.notification = useService("notification");
        this.state = useState({ loading: true, connected: false, connecting: false });
        this.config = {};
        this.pending = null;
        this.onMessage = this.onMessage.bind(this);
        onWillStart(() => this.refresh());
        onWillUnmount(() => this.stopListening());
    }

    async refresh() {
        this.config = await loadSpokiConfig();
        this.state.connected = Boolean(this.config.signing_key);
        this.state.loading = false;
    }

    connect() {
        if (this.state.connecting) {
            return;
        }
        const state = randomState();
        const url = new URL(CONNECT_PATH, this.config.app_url);
        url.search = new URLSearchParams({
            database_uuid: this.config.database_uuid,
            origin: window.location.origin,
            state,
        }).toString();
        const popup = window.open(url.toString(), CONNECT_WINDOW_NAME, CONNECT_WINDOW_FEATURES);
        if (!popup) {
            this.notification.add("Your browser blocked the Spoki window. Allow pop-ups for this site and try again.", { type: "warning" });
            return;
        }
        const timer = setInterval(() => {
            if (popup.closed) {
                clearInterval(timer);
                setTimeout(() => this.stopListening(), POPUP_CLOSED_GRACE_MS);
            }
        }, POPUP_POLL_MS);
        this.pending = { state, popup, appOrigin: url.origin, timer };
        window.addEventListener("message", this.onMessage);
        this.state.connecting = true;
    }

    stopListening() {
        if (!this.pending) {
            return;
        }
        clearInterval(this.pending.timer);
        window.removeEventListener("message", this.onMessage);
        this.pending = null;
        this.state.connecting = false;
    }

    async onMessage(event) {
        const pending = this.pending;
        if (!pending || event.origin !== pending.appOrigin || event.source !== pending.popup) {
            return;
        }
        const data = event.data || {};
        if (data.state !== pending.state) {
            return;
        }
        this.stopListening();
        if (data.type === SpokiConnectMessage.ERROR) {
            this.notification.add(data.message || "Spoki could not connect this Odoo database.", { type: "danger" });
            return;
        }
        if (data.type !== SpokiConnectMessage.CONNECTED) {
            return;
        }
        try {
            await saveSpokiConnection({ signingKey: data.signing_key, baseUrl: data.base_url });
        } catch (error) {
            this.notification.add(error.data?.message || "Could not save the Spoki connection.", { type: "danger" });
            return;
        }
        await this.refresh();
        this.notification.add("Spoki is connected. The Open Spoki Chat button now works on your contacts.", { type: "success" });
    }

    async disconnect() {
        await saveSpokiConnection({ signingKey: "" });
        await this.refresh();
        this.notification.add("Spoki is disconnected from this Odoo database.", { type: "info" });
    }
}

registry.category("view_widgets").add("spoki_connect", { component: SpokiConnect });
