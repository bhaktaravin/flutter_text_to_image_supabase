import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: NextRequest) {
  const { user_id, prompt, image_url } = await req.json();
  if (!user_id || !prompt) {
    return new Response(JSON.stringify({ error: "user_id and prompt required" }), { status: 400 });
  }
  const { error } = await supabase.from("prompts").insert([{ user_id, prompt, image_url }]);
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
