import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { getTokenData } from "./dexscreener.js";

export type WatchedToken = {
    symbol: string;
    address: string;
    threshold: number;
    lastPrice?: number;
};

export class PriceMonitor {
    private timer: NodeJS.Timeout | null = null;
    private watched: WatchedToken[] = [];

    constructor(private api: OpenClawPluginApi) {
        this.watched = (api.pluginConfig?.watchedTokens as WatchedToken[]) || [];
    }

    start() {
        if (this.timer) return;
        this.api.logger.info("Starting Mr. Krabs Money Claw monitor...");
        this.timer = setInterval(() => this.checkPrices(), 1000 * 60 * 5); // Every 5 minutes
    }

    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    private async checkPrices() {
        for (const token of this.watched) {
            const data = await getTokenData(token.address);
            if (!data) continue;

            const currentPrice = parseFloat(data.priceUsd);
            const m5Change = data.priceChange.m5;

            if (m5Change >= token.threshold) {
                this.api.logger.info(`Alert! ${token.symbol} is pumping: ${m5Change}%`);
                this.triggerAlert(token, data);
            }

            token.lastPrice = currentPrice;
        }
    }

    private triggerAlert(token: WatchedToken, data: any) {
        const channel = this.api.pluginConfig?.alertChannel as string || "telegram";
        const to = this.api.pluginConfig?.alertTo as string;

        if (!to) {
            this.api.logger.warn("No alertTo configured for Mr. Krabs alerts.");
            return;
        }

        const message = `Arrr! Me sensors are twitching! **$${token.symbol}** is pumping **${data.priceChange.m5}%** in the last 5 minutes! Current price: **$${data.priceUsd}**. DON'T LET ME TREASURE SLIP AWAY! CLAW IN NOW! 🦀💰`;

        // Use a hook or direct delivery if possible.
        // Since we don't have a direct "sendMessage" in OpenClawPluginApi yet, 
        // we might need to use a gateway method or a hook.
        // For now, let's use a diagnostic event or log it.
        // Ideally, we'd trigger a "wake" event or similar.

        // In OpenClaw, we can use system events or deliver directly to a channel via a tool?
        this.api.logger.info(`Mr. Krabs Alert: ${message}`);

        this.api.runtime.system.enqueueSystemEvent(message, {
            sessionKey: to
        });
    }
}
