import { DainClientAuth } from "npm:@dainprotocol/service-sdk/client/client-auth";
import { loadEnv } from "./util/env.ts";
import { setValue, getValue } from "./util/value.ts";
import { DainSDK } from "npm:@dainprotocol/service-sdk/client";

export interface AutomationContext {
  request: Request;
  agentAuth: DainClientAuth;
}

export type AutomationHandler = (
  context: AutomationContext
) => Promise<unknown>;

export const kv = {
  setValue,
  getValue,
};

export { DainSDK };

export async function dainAutomation(
  handler: AutomationHandler
): Promise<Deno.HttpServer> {
  const env = await loadEnv();

  return Deno.serve(
    {
      port: Number(env("PORT")) || 8888,
    },
    async (request: Request) => {
      try {
        // Create auth instance
        const agentAuth = new DainClientAuth({
          apiKey: env("DAIN_API_KEY"),
        });

        // Create context and run handler
        const context: AutomationContext = {
          agentAuth,
          request,
        };

        const result = await handler(context);

        // If result contains an error property, return it as an error response
        if (result && typeof result === "object" && "throw" in result) {
          return new Response(JSON.stringify({ error: result.throw }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }

        // Return JSON response
        return new Response(JSON.stringify(result), {
          headers: { "content-type": "application/json" },
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { "content-type": "application/json" },
        });
      }
    }
  );
}
