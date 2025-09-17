import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { app as firebaseApp } from "@/lib/firebaseClient";


export async function POST(req: NextRequest) {
  const { prompt, user, model } = await req.json();
  console.log("Received model:", model);
  console.log("Received prompt:", prompt);
  if (!prompt || !user || !model) {
    return new Response(JSON.stringify({ error: "Prompt, user, and model required" }), { status: 400 });
  }

  let imageUrl = "";
  let errorMsg = "";

  try {
    if (model === "fal-ai") {
      const falApiKey = process.env.FAL_API_KEY;
      if (!falApiKey) {
        console.error("FAL_API_KEY is missing");
        return new Response(JSON.stringify({ error: "API key missing" }), { status: 500 });
      }
      const response = await fetch("https://fal.run/fal-ai/stable-diffusion-v35-large", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Key ${falApiKey}`,
        },
        body: JSON.stringify({ prompt }),
      });
      const data = await response.json();
      imageUrl = data.image_url || data.images?.[0]?.url || data.result?.image_url;
      if (!response.ok) errorMsg = data.error || "Fal.ai error";
    } else if (model === "deepai") {
      // Use DEEPAI_API_KEY from environment
      const DEEPAI_API_KEY = process.env.DEEPAI_API_KEY;
      if (!DEEPAI_API_KEY) {
        console.error("DEEPAI_API_KEY is missing");
        return new Response(JSON.stringify({ error: "DeepAI API key missing" }), { status: 500 });
      }
      const response = await fetch("https://api.deepai.org/api/text2img", {
        method: "POST",
        headers: {
          "Api-Key": DEEPAI_API_KEY,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `text=${encodeURIComponent(prompt)}`,
      });
      const data = await response.json();
      imageUrl = data.output_url;
      if (!response.ok) {
        // Log and return full DeepAI error message
        console.error("DeepAI error response:", data);
        errorMsg = data.error || JSON.stringify(data) || "DeepAI error";
      }
    } else {
      errorMsg = "Model not supported yet.";
    }

    if (errorMsg) {
      return new Response(JSON.stringify({ error: errorMsg }), { status: 400 });
    }

    // Store prompt and image URL in Supabase
    const { error: supabaseError } = await supabase.from("images").insert([
      { prompt, image_url: imageUrl, user_email: user.email, created_at: new Date().toISOString() }
    ]);
    if (supabaseError) {
      console.error("Supabase error:", supabaseError);
      return new Response(JSON.stringify({ error: supabaseError.message }), { status: 500 });
    }

    // Store user profile in Firestore (non-blocking)
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
    }

    return new Response(JSON.stringify({ imageUrl, prompt, user }), { status: 200 });
  } catch (error) {
    console.error("API route error:", error);
    return new Response(JSON.stringify({ error: "Internal server error", details: String(error) }), { status: 500 });
  }
}