/** @odoo-module **/

/**
 * Client-side signing for the Spoki `crm_chat` handoff.
 *
 * The signature MUST reproduce the backend canonical form byte-for-byte
 * (integrations/odoo/services/signature.py):
 *
 *   canonical = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
 *   signature = HMAC_SHA256(key=hex_decode(signing_key), msg=canonical).hexdigest()
 *
 * Two subtleties that break signatures if missed:
 *   1. Python's json.dumps defaults to ensure_ascii=True — every code point >= 0x80
 *      is escaped as \uXXXX (surrogate pairs for astral chars). JS JSON.stringify
 *      leaves them raw, so we escape them ourselves in `pyJsonString`.
 *   2. The signing key is hex-encoded; HMAC must key on the DECODED bytes, not the
 *      hex string.
 */

const CRM_CHAT_PATH = "/odoo/v1/crm_chat/";

function pyJsonString(value) {
    // Serialize a JS string exactly like Python's json.dumps(ensure_ascii=True) would.
    let out = '"';
    for (const ch of value) {
        const code = ch.codePointAt(0);
        if (ch === '"') {
            out += '\\"';
        } else if (ch === "\\") {
            out += "\\\\";
        } else if (code === 0x08) {
            out += "\\b";
        } else if (code === 0x09) {
            out += "\\t";
        } else if (code === 0x0a) {
            out += "\\n";
        } else if (code === 0x0c) {
            out += "\\f";
        } else if (code === 0x0d) {
            out += "\\r";
        } else if (code < 0x20) {
            out += "\\u" + code.toString(16).padStart(4, "0");
        } else if (code < 0x80) {
            out += ch;
        } else if (code > 0xffff) {
            const c = code - 0x10000;
            const hi = 0xd800 + (c >> 10);
            const lo = 0xdc00 + (c & 0x3ff);
            out += "\\u" + hi.toString(16).padStart(4, "0") + "\\u" + lo.toString(16).padStart(4, "0");
        } else {
            out += "\\u" + code.toString(16).padStart(4, "0");
        }
    }
    return out + '"';
}

export function canonicalize(payload) {
    // Flat object of string values → json.dumps(sort_keys=True, separators=(",",":"), ensure_ascii=True).
    const keys = Object.keys(payload).sort();
    const parts = keys.map((k) => pyJsonString(k) + ":" + pyJsonString(String(payload[k])));
    return "{" + parts.join(",") + "}";
}

function hexToBytes(hex) {
    const clean = (hex || "").trim();
    const bytes = new Uint8Array(clean.length / 2);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(clean.substr(i * 2, 2), 16);
    }
    return bytes;
}

function bytesToHex(buffer) {
    return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function hmacSha256Hex(keyHex, message) {
    const key = await crypto.subtle.importKey("raw", hexToBytes(keyHex), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
    return bytesToHex(signature);
}

function nowUnixSeconds() {
    return String(Math.floor(Date.now() / 1000));
}

/**
 * Build the fully-signed crm_chat GET URL.
 *
 * @param {string} baseUrl - Spoki backend base (no trailing slash), e.g. https://internal.spoki.com
 * @param {string} signingKeyHex - hex signing key from Spoki → Integrations → Odoo
 * @param {Object} fields - { databaseUuid, phone, email, firstname, lastname, userEmail }
 * @returns {Promise<string>} the signed URL
 */
export async function buildSignedCrmChatUrl(baseUrl, signingKeyHex, fields) {
    const payload = { ...fields, ts: nowUnixSeconds() };
    const signature = await hmacSha256Hex(signingKeyHex, canonicalize(payload));
    const params = new URLSearchParams({ ...payload, signature });
    return `${baseUrl}${CRM_CHAT_PATH}?${params.toString()}`;
}
