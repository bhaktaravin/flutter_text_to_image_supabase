import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();
  if (!prompt) {
    return new Response(JSON.stringify({ error: "Prompt is required" }), { status: 400 });
  }

  try {
    const falApiKey = process.env.FAL_API_KEY;
    if (!falApiKey) {
      console.error("FAL_API_KEY is missing");
      return new Response(JSON.stringify({ error: "API key missing" }), { status: 500 });
    }
    const response = await fetch("https://fal.run/fal-ai/stable-diffusion-v35-large", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Key ${process.env.FAL_API_KEY}`,
      },
      body: JSON.stringify({ prompt }),
    });
    const data = await response.json();
    console.log("Fal.ai response:", data);
    console.error("Fal.ai error:", data);   
    
    if (!response.ok) {
      console.error("Fal.ai error:", data);
      return new Response(JSON.stringify({ error: data.error || "Fal.ai error", details: data }), { status: response.status });
    }
    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error) {
    console.error("API route error:", error);
    return new Response(JSON.stringify({ error: "Internal server error", details: String(error) }), { status: 500 });
  }
}