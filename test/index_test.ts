import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { dainAutomation } from "../src/index.ts";
import { DainSDK } from "npm:@dainprotocol/service-sdk@1.0.67/client";
import { loadEnv } from "../src/util/env.ts";
import { getValue, setValue } from "../src/util/value.ts";

const getEnv = await loadEnv();

Deno.test({
  name: "dainAutomation - weather integration test",
  async fn() {
    // Create server with a handler that returns weather
    const server = await dainAutomation(async (context) => {
      const { agentAuth } = context;
      const sdk = new DainSDK(
        "https://seashell-app-yx73p.ondigitalocean.app",
        agentAuth
      );
      await sdk.initialize();

      // @ts-ignore - mock weather call
      const weather = await sdk.getWeather({
        latitude: 40.7128,
        longitude: -74.006,
      });

      return {
        weather: weather
      };
    });

    // Wait a bit for the server to start
    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      // Test invalid API key
      const invalidResponse = await fetch("http://localhost:" + getEnv("PORT"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "invalid-key"
        }
      });
      assertEquals(invalidResponse.status, 401);

      // Test valid request
      const response = await fetch("http://localhost:" + getEnv("PORT"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": getEnv("API_KEY") || ""
        }
      });

      assertEquals(response.status, 200);
      const data = await response.json();
      console.log(data);

      // test setValue and getValue
      await setValue("test", "test");
      const value = await getValue("test");
      assertEquals(value, "test");

      // Test weather response
      assertEquals(data.weather.text.includes("The current temperature"), true);

      // Test missing API key
      const noKeyResponse = await fetch("http://localhost:" + getEnv("PORT"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      });
      assertEquals(noKeyResponse.status, 401);

    } finally {
      // Clean up: close the server
      server.shutdown();
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});
