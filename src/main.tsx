import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const CHUNK_RELOAD_KEY = "chunk-reload-attempted";

function isChunkLoadError(reason: unknown): boolean {
	const message =
		reason instanceof Error
			? reason.message
			: typeof reason === "string"
				? reason
				: "";

	return (
		message.includes("Failed to fetch dynamically imported module") ||
		message.includes("Importing a module script failed") ||
		message.includes("ChunkLoadError")
	);
}

function isBlockedTelemetryError(reason: unknown): boolean {
	const message =
		reason instanceof Error
			? reason.message
			: typeof reason === "string"
				? reason
				: "";

	const normalized = message.toLowerCase();
	return (
		normalized.includes("err_blocked_by_client") &&
		(normalized.includes("posthog") || normalized.includes("us.i.posthog.com"))
	);
}

function attemptChunkRecovery() {
	const hasReloaded = sessionStorage.getItem(CHUNK_RELOAD_KEY) === "1";
	if (hasReloaded) return;
	sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
	window.location.reload();
}

window.addEventListener("unhandledrejection", (event) => {
	if (isBlockedTelemetryError(event.reason)) {
		event.preventDefault();
		return;
	}

	if (isChunkLoadError(event.reason)) {
		attemptChunkRecovery();
	}
});

window.addEventListener("error", (event) => {
	if (isBlockedTelemetryError(event.error ?? event.message)) {
		event.preventDefault();
		return;
	}

	if (isChunkLoadError(event.error ?? event.message)) {
		attemptChunkRecovery();
	}
});

window.addEventListener("load", () => {
	sessionStorage.removeItem(CHUNK_RELOAD_KEY);
});

createRoot(document.getElementById("root")!).render(<App />);
