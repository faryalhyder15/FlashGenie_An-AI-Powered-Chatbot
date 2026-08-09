import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { conversationId } = await req.json();

    if (!conversationId) {
      return NextResponse.json(
        { error: "Conversation ID is required" },
        { status: 400 }
      );
    }

    // -----------------------------------------
    // 1. GET UPLOADED STUDY MATERIAL
    // -----------------------------------------

    const { data: sources, error: sourcesError } = await supabase
      .from("sources")
      .select("file_name, extracted_text")
      .eq("conversation_id", conversationId);

    if (sourcesError) {
      console.error("Sources error:", sourcesError);
    }

    // -----------------------------------------
    // 2. GET PREVIOUS CHAT MESSAGES
    // -----------------------------------------

    const { data: messages, error: messagesError } = await supabase
      .from("messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (messagesError) {
      console.error("Messages error:", messagesError);
    }

    // -----------------------------------------
    // 3. BUILD STUDY CONTEXT
    // -----------------------------------------

    const sourceContext = (sources || [])
      .map(
        (source) =>
          `--- SOURCE: ${source.file_name || "Study Material"} ---\n${
            source.extracted_text || ""
          }`
      )
      .join("\n\n");

    const messageContext = (messages || [])
      .map(
        (message) =>
          `${message.role === "user" ? "Student" : "Tutor"}: ${
            message.content
          }`
      )
      .join("\n");

    const context = `
UPLOADED STUDY MATERIAL:

${sourceContext || "No uploaded study material."}

PREVIOUS CONVERSATION:

${messageContext || "No previous conversation."}
`;

    // -----------------------------------------
    // 4. CHECK GEMINI API KEY
    // -----------------------------------------

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is missing." },
        { status: 500 }
      );
    }

    // -----------------------------------------
    // 5. INITIALIZE GEMINI
    // -----------------------------------------

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    // -----------------------------------------
    // 6. FLASHCARD PROMPT
    // -----------------------------------------

    const prompt = `
You are FlashGenie, an expert educational assistant.

Based ONLY on the study material and conversation provided below, generate exactly 5 high-quality flashcards.

The flashcards should help a university student understand and remember the most important concepts.

Rules:

1. Use the uploaded study material as the primary source.
2. Do not invent facts that are not supported by the material.
3. Focus on important concepts, definitions, processes, examples, and relationships.
4. Questions should test understanding rather than simply copying sentences.
5. Answers should be clear and detailed enough for studying.
6. Keep answers concise and easy to understand.
7. Return ONLY valid JSON.
8. Do NOT use Markdown.
9. Do NOT wrap the JSON in code fences.
10. Do NOT include any explanation outside the JSON.

Required JSON structure:

{
  "flashcards": [
    {
      "front": "Question or term",
      "back": "Answer or definition"
    }
  ]
}

Study Context:

${context.slice(0, 12000)}
`;

    // -----------------------------------------
    // 7. GENERATE FLASHCARDS
    // -----------------------------------------

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            flashcards: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  front: {
                    type: "string",
                  },
                  back: {
                    type: "string",
                  },
                },
                required: ["front", "back"],
              },
            },
          },
          required: ["flashcards"],
        },
      },
    });

    // -----------------------------------------
    // 8. PARSE GEMINI RESPONSE
    // -----------------------------------------

    const text = response.text || "";

    const parsed = JSON.parse(text);

    // -----------------------------------------
    // 9. VALIDATE RESPONSE
    // -----------------------------------------

    if (
      !parsed.flashcards ||
      !Array.isArray(parsed.flashcards)
    ) {
      throw new Error("Gemini returned an invalid flashcard format.");
    }

    // -----------------------------------------
    // 10. RETURN FLASHCARDS
    // -----------------------------------------

    return NextResponse.json({
      success: true,
      flashcards: parsed.flashcards,
    });
  } catch (err: any) {
    console.error(
      "❌ /api/flashcards error:",
      err?.message || err
    );

    return NextResponse.json(
      {
        error:
          err?.message ||
          "Failed to generate flashcards",
      },
      { status: 500 }
    );
  }
}