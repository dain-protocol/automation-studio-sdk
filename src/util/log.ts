import fetcher from "./signFetch.ts";
import { loadEnv } from "./env.ts";

const env = await loadEnv();

type LogLevel = "info" | "warn" | "error";

interface LogMessage {
  message: string;
  level: LogLevel;
}

class Logger {
  private queue: Promise<any>[] = [];
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${env("API_URL")}/api/autonomy-sdk-api/log`;
  }

  private async sendLog(message: string, level: LogLevel) {
    const promise = fetcher(this.baseUrl, {
      method: "POST",
      body: JSON.stringify({
        message,
        level,
      }),
    }).catch(err => {
      console.error("Failed to send log:", err);
    }).then(() => void 0);

    this.queue.push(promise);
  }

  log(message: string) {
    this.sendLog(message, "info");
  }

  warn(message: string) {
    this.sendLog(message, "warn");
  }

  error(message: string) {
    this.sendLog(message, "error");
  }

  // Call this at the end of your main function to ensure all logs are sent
  async flush() {
    if (this.queue.length === 0) return;
    await Promise.all(this.queue);
    this.queue = [];
  }
}

export const logger = new Logger();
