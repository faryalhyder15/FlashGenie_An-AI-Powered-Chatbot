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
    // 2. GET PREVIOUS CONVERSATION
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
    // 3. BUILD CONTEXT
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
    // 4. CHECK API KEY
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
    // 6. STORYBOARD PROMPT
    // -----------------------------------------

    const prompt = `
You are FlashGenie, an expert educational visual storytelling assistant.

Create a 4-scene educational visual storyboard that explains the main concept from the study material.

IMPORTANT RULES:

1. Use the uploaded study material as the PRIMARY source.
2. Identify the most important concept or topic.
3. Break the concept into exactly 4 logical scenes.
4. Each scene should build naturally on the previous scene.
5. The visual description should explain what should appear on screen.
6. The narration should be suitable for a short educational video voiceover.
7. Keep the explanation simple and student-friendly.
8. Do not invent facts that are not supported by the study material.
9. Return ONLY valid JSON.
10. Do NOT use Markdown.
11. Do NOT use code fences.
12. Do NOT include any text outside the JSON.

Return exactly this structure:

{
  "title": "Topic Visual Storyboard",
  "scenes": [
    {
      "scene": 1,
      "visual": "Visual scene layout description",
      "narration": "Voiceover audio text"
    },
    {
      "scene": 2,
      "visual": "Visual scene layout description",
      "narration": "Voiceover audio text"
    },
    {
      "scene": 3,
      "visual": "Visual scene layout description",
      "narration": "Voiceover audio text"
    },
    {
      "scene": 4,
      "visual": "Visual scene layout description",
      "narration": "Voiceover audio text"
    }
  ]
}

STUDY CONTEXT:

${context.slice(0, 12000)}
`;

    // -----------------------------------------
    // 7. GENERATE STORYBOARD
    // -----------------------------------------

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            title: {
              type: "string",
            },
            scenes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  scene: {
                    type: "number",
                  },
                  visual: {
                    type: "string",
                  },
                  narration: {
                    type: "string",
                  },
                },
                required: [
                  "scene",
                  "visual",
                  "narration",
                ],
              },
            },
          },
          required: ["title", "scenes"],
        },
      },
    });

    // -----------------------------------------
    // 8. PARSE RESPONSE
    // -----------------------------------------

    const text = response.text || "";

    const parsed = JSON.parse(text);

    // -----------------------------------------
    // 9. VALIDATE RESPONSE
    // -----------------------------------------

    if (!parsed.scenes || !Array.isArray(parsed.scenes)) {
      throw new Error(
        "Gemini returned an invalid storyboard format."
      );
    }

    if (parsed.scenes.length !== 4) {
      throw new Error(
        `Expected 4 scenes but received ${parsed.scenes.length}.`
      );
    }

    // -----------------------------------------
    // 10. RETURN STORYBOARD
    // -----------------------------------------

    return NextResponse.json({
      success: true,
      title: parsed.title,
      scenes: parsed.scenes,
    });
  } catch (err: any) {
    console.error(
      "❌ /api/storyboard error:",
      err?.message || err
    );

    return NextResponse.json(
      {
        error:
          err?.message ||
          "Failed to generate storyboard",
      },
      { status: 500 }
    );
  }
}