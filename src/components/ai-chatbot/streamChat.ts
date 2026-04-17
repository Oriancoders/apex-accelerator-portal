import { supabase } from "@/integrations/supabase/client";
import type { Msg } from "@/components/ai-chatbot/types";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

type StreamChatParams = {
  messages: Msg[];
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (err: string) => void;
};

export async function streamChat({ messages, onDelta, onDone, onError }: StreamChatParams) {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      onError("Please sign in to use the AI assistant.");
      return;
    }

    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ messages }),
    });

    if (!resp.ok) {
      const body = await resp.json().catch(() => ({ error: "Request failed" }));
      onError(body.error || "Something went wrong");
      return;
    }

    if (!resp.body) {
      onError("No response stream");
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let idx: number;
      while ((idx = buffer.indexOf("\n")) !== -1) {
        let line = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const json = line.slice(6).trim();
        if (json === "[DONE]") {
          onDone();
          return;
        }

        try {
          const parsed = JSON.parse(json);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) onDelta(content);
        } catch {
          buffer = line + "\n" + buffer;
          break;
        }
      }
    }

    onDone();
  } catch (err) {
    console.error("AI chat stream error:", err instanceof Error ? err.message : err);
    onError("Connection failed. Please check your network and try again.");
  }
}
