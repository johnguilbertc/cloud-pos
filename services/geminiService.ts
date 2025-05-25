// Fix: Import GoogleGenAI and GenerateContentResponse from "@google/generative-ai"
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_API_KEY } from '../constants';

if (!GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_GEMINI_API_KEY_HERE") {
  console.warn(
    "Gemini API key is not configured. AI features will not work. " +
    "Please set the VITE_GEMINI_API_KEY environment variable or update constants.ts (for local dev only)."
  );
}

// Fix: Initialize GoogleGenerativeAI with named apiKey parameter
const ai = new GoogleGenerativeAI(GEMINI_API_KEY);
// Fix: Use the correct model name
const model = ai.getGenerativeModel({ model: "gemini-pro" });

export const generateDescriptionWithGemini = async (
  itemName: string, 
  categoryName?: string, 
  price?: number
): Promise<string> => {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_GEMINI_API_KEY_HERE") {
    return Promise.reject(new Error("Gemini API key not configured. Cannot generate description."));
  }

  let prompt = `Generate a concise, appealing, and slightly enthusiastic menu description for a cafe item.
  The item is called "${itemName}".`;

  if (categoryName) {
    prompt += ` It belongs to the "${categoryName}" category.`;
  }
  if (price !== undefined) {
    prompt += ` It costs ₱${price.toFixed(2)}.`;
  }
  prompt += ` The description should be 1-2 sentences long, suitable for a cafe menu.
  Focus on taste, key ingredients (if obvious from name), or the experience of enjoying it. Avoid overly technical terms.
  Make it sound delicious and inviting!`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    if (!text) {
      throw new Error("Received an empty response from Gemini API.");
    }
    return text.trim();

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
      // Check for common API key or permission issues
      if (error.message.includes('API_KEY_INVALID') || error.message.includes('permission')) {
        throw new Error("Gemini API request failed: Invalid API key or insufficient permissions. Please check your API key and project setup.");
      }
      throw new Error(`Gemini API request failed: ${error.message}`);
    }
    throw new Error("An unknown error occurred while communicating with Gemini API.");
  }
};
