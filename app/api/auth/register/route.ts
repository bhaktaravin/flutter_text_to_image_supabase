import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { app as firebaseApp } from "@/lib/firebaseClient";

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
    // Also save user profile to Firestore
    try {
      const db = getFirestore(firebaseApp);
      await setDoc(doc(db, "users", email), {
        email,
        name,
        supabase_id: userId,
        createdAt: new Date(),
      }, { merge: true });
    } catch (firestoreError) {
      console.error("Firestore error (register):", firestoreError);
      // Optionally, you can add error info to the response if needed
    }
  }
  return new Response(JSON.stringify({ user: data.user }), { status: 200 });
}
