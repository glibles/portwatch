import { execSync } from "child_process";
import { AlertEvent } from "./alertManager";

export type NotifierChannel = "console" | "desktop" | "webhook";

export interface NotifierConfig {
  channels: NotifierChannel[];
  webhookUrl?: string;
}

export function notifyConsole(alert: AlertEvent): void {
  const timestamp = new Date(alert.timestamp).toISOString();
  console.warn(`[ALERT ${timestamp}] ${alert.message}`);
}

export function notifyDesktop(alert: AlertEvent): void {
  const platform = process.platform;
  const title = "portwatch alert";
  const body = alert.message.replace(/'/g, "'\\''");

  try {
    if (platform === "darwin") {
      execSync(
        `osascript -e 'display notification "${body}" with title "${title}"'`,
        { stdio: "ignore" }
      );
    } else if (platform === "linux") {
      execSync(`notify-send "${title}" "${body}"`, { stdio: "ignore" });
    }
  } catch {
    // Desktop notifications are best-effort; silently skip if unavailable
  }
}

export async function notifyWebhook(
  alert: AlertEvent,
  webhookUrl: string
): Promise<void> {
  const payload = JSON.stringify({
    timestamp: alert.timestamp,
    message: alert.message,
    port: alert.port,
    protocol: alert.protocol,
  });

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
  });

  if (!response.ok) {
    throw new Error(
      `Webhook delivery failed: ${response.status} ${response.statusText}`
    );
  }
}

export async function dispatchAlert(
  alert: AlertEvent,
  config: NotifierConfig
): Promise<void> {
  for (const channel of config.channels) {
    if (channel === "console") {
      notifyConsole(alert);
    } else if (channel === "desktop") {
      notifyDesktop(alert);
    } else if (channel === "webhook" && config.webhookUrl) {
      await notifyWebhook(alert, config.webhookUrl);
    }
  }
}
