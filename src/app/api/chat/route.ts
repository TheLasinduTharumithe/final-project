import { NextResponse } from "next/server";
import { getChatbotAnswer, resolveChatUser } from "@/services/chatbot";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { message?: string };
    const message = body.message?.trim();

    if (!message) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    const authorization = request.headers.get("authorization") || "";
    const idToken = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
    const { profile, idToken: verifiedToken } = await resolveChatUser(idToken);
    const reply = await getChatbotAnswer({
      message,
      profile,
      idToken: verifiedToken
    });
    return NextResponse.json({ reply });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Chat service error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
