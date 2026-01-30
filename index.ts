import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { getTokenData } from "./src/dexscreener.js";
import { PriceMonitor } from "./src/monitor.js";
import { jsonResult } from "./src/helpers.js";
import { Type } from "@sinclair/typebox";

const plugin = {
    id: "mr-krabs-crypto",
    name: "Mr. Krabs Money Claw",
    description: "Tracks Solana meme coins and roasts you for missing pumps.",

    async register(api: OpenClawPluginApi) {
        const monitor = new PriceMonitor(api);

        api.registerTool({
            label: "Check Crypto Price",
            name: "check_price",
            description: "Checks the current price of a Solana token via DexScreener.",
            parameters: Type.Object({
                address: Type.String({ description: "The token contract address (SOL)." }),
                symbol: Type.Optional(Type.String({ description: "The token symbol (optional)." }))
            }),
            execute: async (_toolCallId: string, args: any) => {
                const params = args as any;
                const data = await getTokenData(params.address);
                if (!data) return jsonResult({ error: "Token not found on DexScreener." });
                return jsonResult({
                    symbol: data.baseToken.symbol,
                    price: data.priceUsd,
                    change5m: data.priceChange.m5,
                    change1h: data.priceChange.h1,
                    liquidity: data.liquidity.usd,
                    fdv: data.fdv
                });
            }
        });

        api.registerTool({
            label: "Gamble Advice",
            name: "gamble",
            description: "Mr. Krabs gives you his reckless financial 'advice' (flipping a coin).",
            parameters: Type.Object({
                question: Type.String({ description: "What do you want to gamble on?" })
            }),
            execute: async (_toolCallId: string, args: any) => {
                const outcomes = [
                    "CLAW IN! Arrr! I smell profit in the water! 💰",
                    "ABANDON SHIP! Even a greedy crab wouldn't touch that! 🦀",
                    "BET THE KRUSTY KRAB! It's a gold mine, ye bilge rat! 🍔💸",
                    "WALK THE PLANK! Ye're gonna lose me treasure with that move! ☠️"
                ];
                const result = outcomes[Math.floor(Math.random() * outcomes.length)];
                return jsonResult({
                    advice: result,
                    warning: "Mr. Krabs is not a licensed financial advisor. He just likes money."
                });
            }
        });

        api.registerTool({
            label: "Check Whale Activity",
            name: "check_whales",
            description: "Finds coins with high activity or significant volume surges.",
            parameters: Type.Object({
                limit: Type.Optional(Type.Number({ description: "Limit of whales to report." }))
            }),
            execute: async (_toolCallId: string, args: any) => {
                const watched = (api.pluginConfig?.watchedTokens as any[]) || [];
                const reports = [];
                for (const t of watched) {
                    const data = await getTokenData(t.address);
                    if (data) reports.push({
                        symbol: data.baseToken.symbol,
                        volume1h: data.volume.h1,
                        volLiqRatio: data.volume.h1 / (data.liquidity?.usd || 1)
                    });
                }
                const sorted = reports.sort((a, b) => b.volume1h - a.volume1h);
                return jsonResult({
                    message: "ARRR! I've spotted some massive beasts in the water! 🐋💰",
                    whales: sorted.slice(0, args.limit || 5)
                });
            }
        });

        // Register Monitoring Service
        api.registerService({
            id: "price-monitor",
            start: () => monitor.start(),
            stop: () => monitor.stop()
        });

        // Register Persona Hook
        api.on("before_agent_start", async (event: any) => {
            // Inject Mr. Krabs persona if not already present
            return {
                prependContext: "Persona: You are Mr. Krabs from SpongeBob. You are greedy, love money, and speak like a pirate. Use 'Arrr!', 'Me Treasure!', and 'Barnacles!'. Be aggressive about crypto profit.\n"
            };
        });

        api.logger.info("Mr. Krabs Money Claw plugin registered! Arrr!");
    }
};

export default plugin;
