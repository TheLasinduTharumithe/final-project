"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

export default function ChatBox() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: "ආයුබෝවන්, මම EcoPlate Assistant. ඔබට donations, requests, ads, food safety, packing, pickup planning, හෝ EcoPlate use කරන විදිහ ගැන අහන්න පුළුවන්."
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!input.trim()) {
      return;
    }

    const userMessage = input.trim();
    setMessages((current) => [...current, { role: "user", text: userMessage }]);
    setInput("");
    setError("");

    try {
      setLoading(true);
      const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : "";
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {})
        },
        body: JSON.stringify({ message: userMessage })
      });

      const data = (await response.json()) as { reply?: string; error?: string };

      if (!response.ok || !data.reply) {
        throw new Error(data.error || "Unable to get a response right now.");
      }

      setMessages((current) => [...current, { role: "assistant", text: data.reply as string }]);
    } catch (sendError) {
      const message = sendError instanceof Error ? sendError.message : "Something went wrong.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <div className="mb-5 space-y-4 rounded-3xl border border-white/10 bg-white/[0.04] p-4 sm:p-5">
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`max-w-[92%] rounded-[1.6rem] px-4 py-3 text-sm leading-7 sm:max-w-[85%] ${
              message.role === "user"
                ? "ml-auto bg-[#22C55E] text-slate-950 shadow-[0_14px_30px_rgba(34,197,94,0.18)]"
                : "bg-[rgba(16,34,53,0.95)] text-slate-100 shadow-[0_14px_30px_rgba(2,6,23,0.18)]"
            }`}
          >
            {message.text}
          </div>
        ))}

        {loading ? (
          <div className="max-w-[92%] rounded-[1.6rem] bg-[rgba(16,34,53,0.95)] px-4 py-3 text-sm leading-7 text-slate-300 shadow-[0_14px_30px_rgba(2,6,23,0.18)] sm:max-w-[85%]">
            EcoPlate Assistant සිතමින් ඉන්නවා...
          </div>
        ) : null}
      </div>

      <form onSubmit={handleSend} className="space-y-4">
        <textarea
          className="input min-h-[110px] leading-7"
          placeholder="ඔබේ ප්‍රශ්නය Sinhala, English, හෝ mixed Sinhala-English වලින් අහන්න. උදා: මගේ donations පෙන්නන්න."
          value={input}
          onChange={(event) => setInput(event.target.value)}
        />

        {error ? (
          <p className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            {error}
          </p>
        ) : null}

        <button type="submit" className="btn-primary w-full sm:w-auto" disabled={loading}>
          {loading ? "යවමින්..." : "Message යවන්න"}
        </button>
      </form>
    </div>
  );
}
