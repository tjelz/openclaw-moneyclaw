import type { AgentToolResult } from "@mariozechner/pi-agent-core";

export function jsonResult(payload: unknown): AgentToolResult<unknown> {
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(payload, null, 2),
            },
        ],
        details: payload,
    };
}
