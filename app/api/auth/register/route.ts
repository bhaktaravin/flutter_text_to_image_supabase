import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: NextRequest) {
  const { email, password, name } = await req.json();
  if (!email || !password || !name) {
    return new Response(JSON.stringify({ error: "Email, password, and name required" }), { status: 400 });
  }
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
  // Save user profile to 'profiles' table
  const userId = data.user?.id;
  if (userId) {
    const { error: profileError } = await supabase.from('profiles').insert([{ id: userId, email, name }]);
    if (profileError) {
      return new Response(JSON.stringify({ error: profileError.message }), { status: 500 });
    }
  }
  return new Response(JSON.stringify({ user: data.user }), { status: 200 });
}
