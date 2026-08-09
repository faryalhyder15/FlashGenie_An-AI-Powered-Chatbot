import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
  try {
    // -----------------------------------------
    // 1. SUPABASE CLIENT
    // -----------------------------------------

    const supabase = await createClient();

    // -----------------------------------------
    // 2. CHECK USER AUTHENTICATION
    // -----------------------------------------

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // -----------------------------------------
    // 3. CHECK GEMINI API KEY
    // -----------------------------------------

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        {
          error:
            "GEMINI_API_KEY is missing in environment variables.",
        },
        { status: 500 }
      );
    }

    // -----------------------------------------
    // 4. GET CONVERSATION ID
    // -----------------------------------------

    const { conversationId } = await req.json();

    if (!conversationId) {
      return NextResponse.json(
        { error: "Conversation ID is required." },
        { status: 400 }
      );
    }

    // -----------------------------------------
    // 5. GET UPLOADED SOURCES
    // -----------------------------------------

    const { data: sources, error: sourcesError } =
      await supabase
        .from("sources")
        .select("file_name, extracted_text")
        .eq("conversation_id", conversationId);

    if (sourcesError) {
      console.error("Sources error:", sourcesError);
    }

    // -----------------------------------------
    // 6. GET CHAT MESSAGES
    // -----------------------------------------

    const { data: messages, error: messagesError } =
      await supabase
        .from("messages")
        .select("role, content")
        .eq("conversation_id", conversationId)
        .order("created_at", {
          ascending: true,
        });

    if (messagesError) {
      console.error("Messages error:", messagesError);
    }

    // -----------------------------------------
    // 7. BUILD STUDY CONTEXT
    // -----------------------------------------

    const sourceContext = (sources || [])
      .map(
        (source) =>
          `--- SOURCE: ${
            source.file_name || "Study Material"
          } ---\n${source.extracted_text || ""}`
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

${sourceContext || "No uploaded documents."}

PREVIOUS CONVERSATION:

${messageContext || "No previous conversation."}
`;

    // -----------------------------------------
    // 8. INITIALIZE GEMINI
    // -----------------------------------------

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    // -----------------------------------------
    // 9. CREATE PROMPT
    // -----------------------------------------

    const prompt = `
You are FlashGenie, an educational AI assistant.

Analyze the study material and create a clear visual concept map.

The concept map should:

1. Identify the main topic.
2. Break it into 4 to 6 important steps or components.
3. Arrange the steps in a logical order.
4. Make each step build on the previous one where appropriate.
5. Use simple student-friendly explanations.
6. Base the concept map primarily on the uploaded study material.
7. Do not invent information that is not supported by the study material.
8. Do not add unnecessary information.
9. Return ONLY valid JSON.
10. Do NOT use Markdown.
11. Do NOT use code fences.
12. Do NOT include any text outside the JSON.

Return exactly this structure:

{
  "title": "Concept Map Title",
  "steps": [
    {
      "title": "Short step name",
      "description": "One or two sentence explanation of this step or component."
    },
    {
      "title": "Short step name",
      "description": "One or two sentence explanation of this step or component."
    }
  ]
}

STUDY CONTEXT:

${context.slice(0, 12000)}
`;

    // -----------------------------------------
    // 10. GENERATE CONCEPT MAP
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

            steps: {
              type: "array",

              items: {
                type: "object",

                properties: {
                  title: {
                    type: "string",
                  },

                  description: {
                    type: "string",
                  },
                },

                required: [
                  "title",
                  "description",
                ],
              },
            },
          },

          required: [
            "title",
            "steps",
          ],
        },
      },
    });

    // -----------------------------------------
    // 11. GET GEMINI RESPONSE
    // -----------------------------------------

    const text = response.text || "";

    if (!text) {
      throw new Error(
        "Gemini returned an empty response."
      );
    }

    // -----------------------------------------
    // 12. PARSE JSON
    // -----------------------------------------

    const parsed = JSON.parse(text);

    // -----------------------------------------
    // 13. VALIDATE RESPONSE
    // -----------------------------------------

    if (
      !parsed.title ||
      !Array.isArray(parsed.steps)
    ) {
      throw new Error(
        "Gemini returned an invalid concept map format."
      );
    }

    if (
      parsed.steps.length < 4 ||
      parsed.steps.length > 6
    ) {
      throw new Error(
        `Expected 4-6 steps but received ${parsed.steps.length}.`
      );
    }

    // -----------------------------------------
    // 14. RETURN RESULT
    // -----------------------------------------

    return NextResponse.json({
      success: true,
      title: parsed.title,
      steps: parsed.steps,
    });
  } catch (err: any) {
    console.error(
      "❌ /api/generate-visual error:",
      err?.message || err
    );

    return NextResponse.json(
      {
        error:
          err?.message ||
          "Failed to generate visual",
      },
      { status: 500 }
    );
  }
}