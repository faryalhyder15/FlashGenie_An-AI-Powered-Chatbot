import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractTextFromFile } from "@/lib/file-parser";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await req.formData();

    const file = formData.get("file") as File | null;
    const conversationId = formData.get("conversationId") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file was provided" },
        { status: 400 }
      );
    }

    if (!conversationId) {
      return NextResponse.json(
        { error: "Conversation ID is required" },
        { status: 400 }
      );
    }

    console.log("Uploading file:", {
      name: file.name,
      type: file.type,
      size: file.size,
    });

    // Maximum 20 MB
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File is too large. Maximum size is 20 MB." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text
    const extractedText = await extractTextFromFile(
      buffer,
      file.type
    );

    console.log(
      "Extracted text length:",
      extractedText.length
    );

    if (!extractedText) {
      return NextResponse.json(
        {
          error:
            "Could not extract text from this file. If this is a scanned PDF, OCR may be required.",
        },
        { status: 400 }
      );
    }

    // Upload original file to Supabase Storage
    const filePath = `${user.id}/${conversationId}/${Date.now()}_${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("study-materials")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("Supabase storage error:", uploadError);

      return NextResponse.json(
        { error: uploadError.message },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage
      .from("study-materials")
      .getPublicUrl(filePath);

    // Save source information
    const { data: source, error: dbError } = await supabase
      .from("sources")
      .insert({
        conversation_id: conversationId,
        user_id: user.id,
        file_name: file.name,
        file_type: file.type,
        file_url: publicUrl,
        extracted_text: extractedText,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);

      return NextResponse.json(
        { error: dbError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      source,
      extractedTextLength: extractedText.length,
    });
  } catch (err) {
    console.error("❌ /api/upload error:", err);

    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to process upload",
      },
      { status: 500 }
    );
  }
}