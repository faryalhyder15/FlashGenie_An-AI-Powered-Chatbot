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
    // 2. GET PREVIOUS CHAT
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
    // 6. QUIZ PROMPT
    // -----------------------------------------

    const prompt = `
You are FlashGenie, an expert educational assessment assistant.

Based on the study material below, create exactly 3 multiple-choice questions.

IMPORTANT RULES:

1. Use the uploaded study material as the PRIMARY source.
2. Questions must be answerable from the provided material.
3. Do not invent information that is not supported by the material.
4. Create meaningful questions that test understanding.
5. Each question must have exactly 4 options.
6. Only ONE option can be correct.
7. The "answer" field must exactly match one of the options.
8. Include a short explanation of why the answer is correct.
9. Avoid duplicate questions.
10. Return ONLY valid JSON.
11. Do NOT use Markdown.
12. Do NOT use code fences.
13. Do NOT include any text outside the JSON.

Return exactly this structure:

{
  "title": "Quiz Assessment",
  "questions": [
    {
      "id": 1,
      "question": "Question text?",
      "options": [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
      ],
      "answer": "Option A",
      "explanation": "Why Option A is correct."
    }
  ]
}

STUDY CONTEXT:

${context.slice(0, 12000)}
`;

    // -----------------------------------------
    // 7. GENERATE QUIZ
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
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: {
                    type: "number",
                  },
                  question: {
                    type: "string",
                  },
                  options: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                  },
                  answer: {
                    type: "string",
                  },
                  explanation: {
                    type: "string",
                  },
                },
                required: [
                  "id",
                  "question",
                  "options",
                  "answer",
                  "explanation",
                ],
              },
            },
          },
          required: ["title", "questions"],
        },
      },
    });

    // -----------------------------------------
    // 8. PARSE RESPONSE
    // -----------------------------------------

    const text = response.text || "";

    const parsed = JSON.parse(text);

    // -----------------------------------------
    // 9. VALIDATE QUIZ
    // -----------------------------------------

    if (
      !parsed.questions ||
      !Array.isArray(parsed.questions)
    ) {
      throw new Error("Gemini returned an invalid quiz format.");
    }

    if (parsed.questions.length !== 3) {
      throw new Error(
        `Expected 3 questions but received ${parsed.questions.length}.`
      );
    }

    // -----------------------------------------
    // 10. RETURN QUIZ
    // -----------------------------------------

    return NextResponse.json({
      success: true,
      title: parsed.title,
      questions: parsed.questions,
    });
  } catch (err: any) {
    console.error(
      "❌ /api/quiz error:",
      err?.message || err
    );

    return NextResponse.json(
      {
        error:
          err?.message ||
          "Failed to generate quiz",
      },
      { status: 500 }
    );
  }
}