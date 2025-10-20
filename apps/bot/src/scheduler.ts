import cron from "node-cron";

export function schedule(cronExpr: string, fn: () => void) {
  cron.schedule(cronExpr, fn, { timezone: "Etc/UTC" });
}
