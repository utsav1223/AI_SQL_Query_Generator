const axios = require("axios");
const AppError = require("./AppError");

const GEMINI_API_URL =
  process.env.GEMINI_API_URL ||
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

exports.callGemini = async ({
  systemInstruction,
  userPrompt,
  temperature = 0,
  maxOutputTokens = 1024,
  responseMimeType,
  returnMeta = false
}) => {
  const generationConfig = {
    temperature,
    maxOutputTokens
  };

  if (responseMimeType) {
    generationConfig.responseMimeType = responseMimeType;
  }

  const body = {
    contents: [
      {
        role: "user",
        parts: [{ text: userPrompt }]
      }
    ],
    generationConfig
  };

  if (systemInstruction) {
    body.systemInstruction = {
      parts: [{ text: systemInstruction }]
    };
  }

  if (!process.env.GEMINI_API_KEY) {
    throw new AppError(503, "AI service is not configured on server.");
  }

  const response = await axios.post(
    `${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`,
    body
  );

  const candidate = response.data?.candidates?.[0] || {};
  const parts = candidate?.content?.parts || [];
  const text = parts
    .map((part) => (typeof part?.text === "string" ? part.text : ""))
    .join("")
    .trim();

  if (returnMeta) {
    return {
      text,
      finishReason: candidate?.finishReason || null
    };
  }

  return text;
};
