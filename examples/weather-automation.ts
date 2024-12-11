import { dainAutomation, kv , DainSDK} from "https://deno.land/x/automation@0.0.1-beta/src/index.ts";

dainAutomation(async (context) => {
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
    weather: weather,
  };
});
