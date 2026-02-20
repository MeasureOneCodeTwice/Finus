export function onExit(callback: () => Promise<void>) {
  process.on("SIGTERM", callback);
}
