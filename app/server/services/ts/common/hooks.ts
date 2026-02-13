export function onExit(callback: () => void) {
    process.on("SIGTERM", callback);
}
