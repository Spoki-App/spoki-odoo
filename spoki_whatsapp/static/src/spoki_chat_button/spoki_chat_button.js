/** @odoo-module **/

import { Component, useState } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";
import { standardWidgetProps } from "@web/views/widgets/standard_widget_props";
import { loadSpokiConfig } from "./spoki_config";
import { buildSignedCrmChatUrl } from "./spoki_signing";

const DEFAULT_WIDTH = 890;
const DEFAULT_HEIGHT = 748;

function splitName(fullName) {
    const parts = (fullName || "").trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
        return { firstname: "", lastname: "" };
    }
    return { firstname: parts[0], lastname: parts.slice(1).join(" ") };
}

export class SpokiChatButton extends Component {
    static template = "spoki_whatsapp.SpokiChatButton";
    static props = { ...standardWidgetProps };

    setup() {
        this.notification = useService("notification");
        this.state = useState({
            chatLink: null,
            width: DEFAULT_WIDTH,
            height: DEFAULT_HEIGHT,
            isOpening: false,
        });
    }

    get record() {
        return this.props.record;
    }

    _prewarmMicPermission() {
        // Ride the click gesture to request mic permission up-front so WhatsApp voice
        // works inside the iframe. Fire-and-forget; the stream is released immediately.
        const md = navigator.mediaDevices;
        if (md && typeof md.getUserMedia === "function") {
            md.getUserMedia({ audio: true })
                .then((stream) => stream.getTracks().forEach((track) => track.stop()))
                .catch(() => {});
        }
    }

    async openChat() {
        if (this.state.isOpening) {
            return;
        }
        const data = this.record.data;
        const phone = ((data.mobile || data.phone) || "").trim();
        if (!phone) {
            this.notification.add("This contact has no phone number. Set Mobile or Phone to start a Spoki chat.", { type: "warning" });
            return;
        }

        this._prewarmMicPermission();
        this.state.isOpening = true;
        try {
            const config = await loadSpokiConfig();
            if (!config.signing_key) {
                this.notification.add(
                    "Spoki is not connected yet. Ask an administrator to click Connect to Spoki in Settings > Spoki.",
                    { type: "warning" }
                );
                return;
            }

            const { firstname, lastname } = splitName(data.name);
            const requestUrl = await buildSignedCrmChatUrl(config.base_url, config.signing_key, {
                databaseUuid: config.database_uuid,
                phone,
                email: data.email || "",
                firstname,
                lastname,
                userEmail: config.user_email,
            });

            // ngrok's free tier serves a browser interstitial (no CORS headers) unless this
            // header is present. Only sent for ngrok base URLs so production stays clean.
            const headers = {};
            if (config.base_url.includes("ngrok")) {
                headers["ngrok-skip-browser-warning"] = "true";
            }

            let response;
            try {
                response = await fetch(requestUrl, { method: "GET", headers });
            } catch {
                this.notification.add("Could not reach Spoki. Check your connection and the Spoki base URL.", { type: "danger" });
                return;
            }
            if (!response.ok) {
                let detail = "Spoki could not open the chat for this contact.";
                try {
                    const error = await response.json();
                    detail = error.detail || error.message || detail;
                } catch {
                    // non-JSON error body — keep the generic message
                }
                this.notification.add(detail, { type: "warning" });
                return;
            }

            const result = await response.json();
            this.state.width = result.width || DEFAULT_WIDTH;
            this.state.height = result.height || DEFAULT_HEIGHT;
            this.state.chatLink = result.link;
        } finally {
            this.state.isOpening = false;
        }
    }

    openPopup() {
        if (!this.state.chatLink) {
            return;
        }
        const features = `popup=yes,width=${this.state.width},height=${this.state.height},resizable=yes,scrollbars=yes`;
        window.open(this.state.chatLink, "spokiChat", features);
    }

    closeChat() {
        this.state.chatLink = null;
    }
}

export const spokiChatButton = {
    component: SpokiChatButton,
};

registry.category("view_widgets").add("spoki_chat_button", spokiChatButton);
