import { DainClientAuth } from "npm:@dainprotocol/service-sdk@1.0.61/client/client-auth";
import { loadEnv } from "./util/env.ts";
import { setValue, getValue } from "./util/value.ts";
import { DainSDK } from "npm:@dainprotocol/service-sdk@1.0.61/client";
import { logger } from "./util/log.ts";

export interface AutomationContext {
  request: Request;
  agentAuth: DainClientAuth;
  log: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
}

export type AutomationHandler = (
  context: AutomationContext
) => Promise<unknown>;

export const kv = {
  setValue,
  getValue,
};

export { DainSDK };

async function validateApiKey(request: Request) {
  const env = await loadEnv();

  const apiKey = request.headers.get("x-api-key");
  if (!apiKey || apiKey !== env("API_KEY")) {
    throw new Error("Invalid or missing API key");
  }
}

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
        // Validate API key first
        await validateApiKey(request);

        // Create auth instance
        if (!env("AGENT_AUTH")) {
          throw new Error("AGENT_AUTH is not set");
        }

        const agentAuth = DainClientAuth.deserialize(
          env("AGENT_AUTH") as string
        );

        // Create context and run handler
        const context: AutomationContext = {
          agentAuth,
          request,
          log: logger.log.bind(logger),
          warn: logger.warn.bind(logger),
          error: logger.error.bind(logger),
        };

        const result = await handler(context);

        // If result contains an error property, return it as an error response
        if (result && typeof result === "object" && "throw" in result) {
          logger.error(`Request failed: ${JSON.stringify(result.throw)}`);
          await logger.flush();
          
          return new Response(JSON.stringify({ error: result.throw }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }

        // Log successful response
        logger.log(`Request completed successfully: ${JSON.stringify(result)}`);
        await logger.flush();

        // Return JSON response
        return new Response(JSON.stringify(result), {
          headers: { "content-type": "application/json" },
        });
      } catch (error) {
        // Log error before sending response
        logger.error(`Request failed with error: ${error.message}`);
        await logger.flush();
        
        return new Response(JSON.stringify({ error: error.message }), {
          status: error.message.includes("API key") ? 401 : 400,
          headers: { "content-type": "application/json" },
        });
      }
    }
  );
}
