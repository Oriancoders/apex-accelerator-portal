import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const CHUNK_RELOAD_KEY = "chunk-reload-attempted";
const RECOVERY_INTENT_KEY = "auth-recovery-intent";

function hasAuthRecoveryParams(url: string) {
	try {
		const parsedUrl = new URL(url);
		const hashParams = new URLSearchParams(parsedUrl.hash.replace(/^#/, ""));
		return (
			parsedUrl.searchParams.get("type") === "recovery" ||
			hashParams.get("type") === "recovery" ||
			parsedUrl.searchParams.has("code") ||
			parsedUrl.searchParams.has("token_hash") ||
			hashParams.has("access_token")
		);
	} catch {
		return false;
	}
}

function logRecoveryDebug(stage: string) {
	try {
		const parsedUrl = new URL(window.location.href);
		const hashParams = new URLSearchParams(parsedUrl.hash.replace(/^#/, ""));
		console.info("[password-reset-debug]", {
			stage,
			path: parsedUrl.pathname,
			searchKeys: Array.from(parsedUrl.searchParams.keys()).sort(),
			hashKeys: Array.from(hashParams.keys()).sort(),
			hasRecoveryParams: hasAuthRecoveryParams(window.location.href),
			type: parsedUrl.searchParams.get("type") || hashParams.get("type") || null,
		});
	} catch {
		console.info("[password-reset-debug]", { stage, path: "invalid-url" });
	}
}

function redirectRecoveryToResetPage() {
	if (window.location.pathname === "/reset-password") return;

	let hasStoredRecoveryIntent = false;
	try {
		hasStoredRecoveryIntent = sessionStorage.getItem(RECOVERY_INTENT_KEY) === "true";
	} catch {
		hasStoredRecoveryIntent = false;
	}

	if (!hasAuthRecoveryParams(window.location.href) && !(hasStoredRecoveryIntent && window.location.pathname === "/auth")) {
		if (window.location.pathname === "/auth") {
			logRecoveryDebug("auth-page-no-recovery-params");
		}
		return;
	}

	try {
		sessionStorage.setItem(RECOVERY_INTENT_KEY, "true");
	} catch {
		// Session storage can be unavailable in strict browser privacy modes.
	}

	const nextUrl = `/reset-password${window.location.search}${window.location.hash}`;
	logRecoveryDebug("redirecting-to-reset-password");
	window.history.replaceState(window.history.state, "", nextUrl);
}

redirectRecoveryToResetPage();

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
