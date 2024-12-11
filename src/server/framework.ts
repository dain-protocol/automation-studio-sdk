import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

export interface ServerConfig {
  port?: number;
  hostname?: string;
}

export interface RequestContext {
  agentAuth: string;
  request: Request;
}

export type HandlerFunction = (context: RequestContext) => Promise<Response>;

export class DenoServer {
  private port: number;
  private hostname: string;

  constructor(config: ServerConfig = {}) {
    this.port = config.port ?? 8000;
    this.hostname = config.hostname ?? "localhost";
  }

  private async validateAuth(request: Request): Promise<string> {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }
    // Add your auth validation logic here
    return authHeader.replace("Bearer ", "");
  }

  private jsonResponse(data: unknown, status = 200): Response {
    return new Response(JSON.stringify(data), {
      status,
      headers: {
        "content-type": "application/json",
      },
    });
  }

  async createHandler(userHandler: HandlerFunction): Promise<void> {
    const handler = async (request: Request): Promise<Response> => {
      try {
        const agentAuth = await this.validateAuth(request);
        const context: RequestContext = {
          agentAuth,
          request,
        };

        const result = await userHandler(context);
        return result;
      } catch (error) {
        return this.jsonResponse({ error: error.message }, 400);
      }
    };

    await serve(handler, {
      port: this.port,
      hostname: this.hostname,
    });
  }
} 