import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    // Check authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { conversationId, message } = await req.json();

    if (!conversationId || !message) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API key is missing." },
        { status: 500 }
      );
    }

    // -----------------------------------------
    // 1. LOAD UPLOADED SOURCES
    // -----------------------------------------

    const { data: sources, error: sourcesError } = await supabase
      .from("sources")
      .select("file_name, extracted_text")
      .eq("conversation_id", conversationId);

    if (sourcesError) {
      console.error("Sources error:", sourcesError);
    }

    const context = (sources || [])
      .map(
        (s) =>
          `--- SOURCE: ${s.file_name} ---\n${s.extracted_text || ""}`
      )
      .join("\n\n");

    // -----------------------------------------
    // 2. LOAD PREVIOUS CHAT MESSAGES
    // -----------------------------------------

    const { data: priorMessages, error: messagesError } = await supabase
      .from("messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(20);

    if (messagesError) {
      console.error("Messages error:", messagesError);
    }

    const historyText = (priorMessages || [])
      .map(
        (m) =>
          `${m.role === "user" ? "Student" : "Tutor"}: ${m.content}`
      )
      .join("\n");

    // -----------------------------------------
    // 3. INITIALIZE GEMINI
    // -----------------------------------------

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    // -----------------------------------------
    // 4. SYSTEM INSTRUCTION
    // -----------------------------------------

    const systemInstruction = `
You are FlashGenie, a friendly and encouraging AI study tutor.

Your job is to help the student understand their study material.

IMPORTANT RULES:

1. Use the user's uploaded study material as the PRIMARY source.
2. If the answer exists in the uploaded material, prioritize that information.
3. Do not invent information that is not present in the source.
4. If the uploaded material does not contain the answer, clearly say:
   "This information is not available in your uploaded material."
5. You may provide general knowledge when appropriate, but clearly distinguish it from the uploaded material.
6. Explain difficult concepts using simple language.
7. Give examples when they improve understanding.
8. Use headings, bullet points, and short paragraphs when helpful.
9. Do not make answers unnecessarily long.
10. Behave like a patient university tutor.

UPLOADED STUDY MATERIAL:

${context || "No documents have been uploaded yet."}

PREVIOUS CONVERSATION:

${historyText || "No previous conversation."}
`;

    // -----------------------------------------
    // 5. SEND REQUEST TO GEMINI
    // -----------------------------------------

    const prompt = `
${systemInstruction}

CURRENT STUDENT QUESTION:

${message}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });

    const aiResponseText = response.text || "I couldn't generate a response.";

    // -----------------------------------------
    // 6. SAVE MESSAGES TO SUPABASE
    // -----------------------------------------

    const { error: insertError } = await supabase
      .from("messages")
      .insert([
        {
          conversation_id: conversationId,
          user_id: user.id,
          role: "user",
          content: message,
        },
        {
          conversation_id: conversationId,
          user_id: user.id,
          role: "assistant",
          content: aiResponseText,
        },
      ]);

    if (insertError) {
      console.error("Message insert error:", insertError);
    }

    // -----------------------------------------
    // 7. UPDATE CONVERSATION TITLE
    // -----------------------------------------

    const { data: conv } = await supabase
      .from("conversations")
      .select("title")
      .eq("id", conversationId)
      .single();

    if (conv && conv.title === "New Study") {
      const generatedTitle =
        message.slice(0, 30) +
        (message.length > 30 ? "..." : "");

      await supabase
        .from("conversations")
        .update({
          title: generatedTitle,
          updated_at: new Date().toISOString(),
        })
        .eq("id", conversationId);
    }

    // -----------------------------------------
    // 8. RETURN RESPONSE
    // -----------------------------------------

    return NextResponse.json({
      response: aiResponseText,
    });
  } catch (err: any) {
    console.error("❌ /api/chat error:", err?.message || err);

    return NextResponse.json(
      {
        error: err?.message || "Failed to process chat",
      },
      { status: 500 }
    );
  }
}