import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: conversation, error } = await supabase
      .from("conversations")
      .insert({
        user_id: user.id,
        title: "New Study",
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(conversation);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to create conversation" },
      { status: 500 }
    );
  }
}