import {
  dainAutomation,
  kv,
  DainSDK,
} from "https://deno.land/x/automation@0.0.2-beta/src/index.ts";

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

  console.log("The weather is ", weather);

  const set_a_value = await kv.setValue("test", "test");
  const get_a_value = await kv.getValue("test");

  console.log("set_a_value", set_a_value);
  console.log("get_a_value", get_a_value);

  return {
    success: true,
  };
});
