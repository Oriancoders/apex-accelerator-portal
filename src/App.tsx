import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { Component, Suspense, type ErrorInfo, type ReactNode } from "react";
import AiChatbot from "@/components/AiChatbot";
import { allRoutes } from "@/routes";

const queryClient = new QueryClient();

const CHUNK_RELOAD_KEY = "chunk-reload-attempted";

function isChunkLoadError(error: unknown): boolean {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";

  return (
    message.includes("Failed to fetch dynamically imported module") ||
    message.includes("Importing a module script failed") ||
    message.includes("ChunkLoadError")
  );
}

type ChunkErrorBoundaryState = {
  hasError: boolean;
  isChunkError: boolean;
};

class ChunkErrorBoundary extends Component<{ children: ReactNode }, ChunkErrorBoundaryState> {
  state: ChunkErrorBoundaryState = {
    hasError: false,
    isChunkError: false,
  };

  static getDerivedStateFromError(error: unknown): ChunkErrorBoundaryState {
    return {
      hasError: true,
      isChunkError: isChunkLoadError(error),
    };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error("Runtime rendering error:", error, info);
  }

  handleReload = () => {
    sessionStorage.removeItem(CHUNK_RELOAD_KEY);
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full rounded-lg border bg-card p-6 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-foreground">We need to refresh the app</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {this.state.isChunkError
              ? "A new version was deployed while this tab was open. Refresh to load the latest files."
              : "Something went wrong while loading this page. Please refresh and try again."}
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            Refresh now
          </button>
        </div>
      </div>
    );
  }
}

function AppLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ChunkErrorBoundary>
            <Suspense fallback={<AppLoading />}>
              <Routes>
                {allRoutes.map((route) => (
                  <Route key={route.path} path={route.path} element={route.element} />
                ))}
              </Routes>
            </Suspense>
          </ChunkErrorBoundary>
          <AiChatbot />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
