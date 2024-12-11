import { ed25519 } from "npm:@noble/curves/ed25519";
import base58 from "npm:bs58";
import { loadEnv } from "./env.ts";

const env = await loadEnv();

const triggerAddress = env("API_AUTH_ADDRESS");
const rawPrivateKey = env("API_AUTH_PRIVATE_KEY");

if (!rawPrivateKey) {
  throw new Error("API_AUTH_PRIVATE_KEY environment variable is required");
}

const privateKey = base58.decode(rawPrivateKey).slice(0, 32);

export async function signData(
  data: Object,
): Promise<string> {
  const dataBytes = new TextEncoder().encode(JSON.stringify(data));

  const sig = ed25519.sign(dataBytes, privateKey);

  return base58.encode(sig);
}

export default async function fetcher<T>(
  input: RequestInfo,
  init: RequestInit,
): Promise<T & { reqSuccess: boolean }> {
  try {
    const body = init?.body ? init.body : JSON.stringify({});

    const pathname_and_query = new URL(input as string).href
    
    
    const toSign = {
      body,
      method: init?.method || "POST",
      url: pathname_and_query,
      date: new Date().toISOString(),
      nonce: base58.encode(ed25519.utils.randomPrivateKey().slice(0, 32)),
    };

    console.log("toSign", toSign);

    const signature = await signData(toSign);
    console.log("triggerAddress", triggerAddress);
    const response = await fetch(input, {
      ...init,
      method: init?.method || "POST",
      body: init?.body ? init.body : (
        init?.method === "GET" ? undefined : JSON.stringify({})
      ),

      headers: {
        ...init?.headers,
        "Content-Type": "application/json",
        "x-signature": signature,
        "x-date": toSign.date,
        "x-nonce": toSign.nonce,
        "x-trigger-address": triggerAddress as string,
      },
    });

    const json = await response.json();

    return {
      ...json,
      reqSuccess: true,
    } as T & { reqSuccess: boolean };
  } catch (e) {
    console.error(e);
    return { reqSuccess: false } as T & { reqSuccess: boolean };
  }
}
