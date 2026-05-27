const axios = require("axios");
const AppError = require("./AppError");
const logger = require("./logger");

const DEFAULT_GEMINI_MODEL = "gemini-2.5-pro";

const getGeminiModel = () =>
  String(process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL)
    .trim()
    .replace(/^models\//, "");

const getGeminiApiUrl = () => {
  const customUrl = String(process.env.GEMINI_API_URL || "").trim();

  if (customUrl) {
    return customUrl;
  }

  return `https://generativelanguage.googleapis.com/v1beta/models/${getGeminiModel()}:generateContent`;
};

const getGeminiApiKey = () =>
  String(process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || "").trim();

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

  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    throw new AppError(503, "AI service is not configured on server.");
  }

  let response;

  try {
    response = await axios.post(
      `${getGeminiApiUrl()}?key=${apiKey}`,
      body
    );
  } catch (error) {
    const providerStatus = error.response?.status;
    const providerMessage =
      error.response?.data?.error?.message || error.response?.data?.message || error.message;

    logger.error("Gemini request failed", error, {
      providerStatus,
      providerMessage
    });

    if ([401, 403].includes(providerStatus)) {
      throw new AppError(
        503,
        "AI provider rejected the server API key. Check GEMINI_API_KEY and API access in your deployment environment.",
        "AI_PROVIDER_AUTH"
      );
    }

    if (providerStatus === 429) {
      throw new AppError(
        503,
        "AI provider quota or rate limit reached. Please try again later.",
        "AI_PROVIDER_QUOTA"
      );
    }

    if (providerStatus >= 400 && providerStatus < 500) {
      throw new AppError(
        502,
        "AI provider could not process this request. Try a shorter prompt or review your schema context.",
        "AI_PROVIDER_REQUEST"
      );
    }

    throw new AppError(
      503,
      "AI service is temporarily unavailable. Please try again.",
      "AI_PROVIDER_UNAVAILABLE"
    );
  }

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
