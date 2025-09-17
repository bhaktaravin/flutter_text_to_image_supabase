import { NextRequest } from "next/server";
import { storage } from "@/lib/firebaseClient";
import { ref, uploadBytes } from "firebase/storage";

export async function POST(req: NextRequest) {
  const { imageUrl, filename } = await req.json();
  if (!imageUrl || !filename) {
    return new Response(JSON.stringify({ error: "imageUrl and filename required" }), { status: 400 });
  }

  // Fetch image from URL
  const response = await fetch(imageUrl);
  if (!response.ok) {
    return new Response(JSON.stringify({ error: "Failed to fetch image from URL" }), { status: 400 });
  }
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Upload to Firebase Storage
  const storageRef = ref(storage, `images/${filename}`);
  try {
    await uploadBytes(storageRef, buffer);
    return new Response(JSON.stringify({ success: true, path: `images/${filename}` }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
