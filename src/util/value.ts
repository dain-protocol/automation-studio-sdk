import { loadEnv } from "./env.ts";
import fetcher from "./signFetch.ts";
const env = await loadEnv();

export async function setValue(key: string, value: any): Promise<any> {
  const url = `${env("API_URL")}/api/autonomy-sdk-api/setValue`;
  const response = await fetcher<{
    value: any;
    success: boolean;
  }>(url, {
    method: "POST",
    body: JSON.stringify({
      key,
      value,
    }),
  });

  if (!response.success) throw new Error("Failed to Set Value");
  return response.value;
}

export async function getValue(key: string): Promise<any> {
  const url = `${env("API_URL")}/api/autonomy-sdk-api/getValue`;
  const response = await fetcher<{
    value: any;
    success: boolean;
  }>(url, {
    method: "POST",
    body: JSON.stringify({
      key,
    }),
  });

  if (!response.success) throw new Error("Failed to fetch value");
  return response.value;
}
