import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { app as firebaseApp } from "@/lib/firebaseClient";


export async function POST(req: NextRequest) {
  const { prompt, user } = await req.json();
  if (!prompt || !user) {
    return new Response(JSON.stringify({ error: "Prompt and user required" }), { status: 400 });
  }

  try {
    const falApiKey = process.env.FAL_API_KEY;
    if (!falApiKey) {
      console.error("FAL_API_KEY is missing");
      return new Response(JSON.stringify({ error: "API key missing" }), { status: 500 });
    }
    // 1. Generate image from fal.ai
    const response = await fetch("https://fal.run/fal-ai/stable-diffusion-v35-large", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Key ${falApiKey}`,
      },
      body: JSON.stringify({ prompt }),
    });
    const data = await response.json();
    if (!response.ok) {
      console.error("Fal.ai error:", data);
      return new Response(JSON.stringify({ error: data.error || "Fal.ai error", details: data }), { status: response.status });
    }

    // 2. Store prompt and image URL in Supabase
    const imageUrl = data.image_url || data.images?.[0]?.url || data.result?.image_url;
    const { error: supabaseError } = await supabase.from("images").insert([
      { prompt, image_url: imageUrl, user_email: user.email, created_at: new Date().toISOString() }
    ]);
    if (supabaseError) {
      console.error("Supabase error:", supabaseError);
      return new Response(JSON.stringify({ error: supabaseError.message }), { status: 500 });
    }

    // 3. Store user profile in Firestore (non-blocking)
    try {
      const db = getFirestore(firebaseApp);
      await setDoc(doc(db, "users", user.email), {
        email: user.email,
        name: user.name || "",
        lastPrompt: prompt,
        lastImageUrl: imageUrl,
        updatedAt: new Date(),
      }, { merge: true });
    } catch (firestoreError) {
      console.error("Firestore error:", firestoreError);
      // Optionally, you can add error info to the response if needed
    }

    return new Response(JSON.stringify({ imageUrl, prompt, user }), { status: 200 });
  } catch (error) {
    console.error("API route error:", error);
    return new Response(JSON.stringify({ error: "Internal server error", details: String(error) }), { status: 500 });
  }
}