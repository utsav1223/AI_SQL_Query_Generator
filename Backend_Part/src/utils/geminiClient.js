const axios = require("axios");
const AppError = require("./AppError");
const logger = require("./logger");

const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
const DEFAULT_MAX_OUTPUT_TOKENS = 2048;

const toPositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

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

const getProviderErrorDetails = (error) => {
  return {
    providerStatus: error.response?.status,
    providerMessage:
      error.response?.data?.error?.message || error.response?.data?.message || error.message
  };
};

const isAuthProviderError = (status, message = "") => {
  return (
    [401, 403].includes(status) ||
    /api key|permission denied|authentication|unauthorized|forbidden/i.test(message)
  );
};

const isModelProviderError = (status, message = "") => {
  return status === 404 || /model.*not found|not found.*model|unsupported model/i.test(message);
};

const isQuotaProviderError = (status, message = "") => {
  return status === 429 || /quota|rate limit|resource exhausted/i.test(message);
};

const isContextProviderError = (message = "") => {
  return /token|context|too long|payload|request.*large|exceeds/i.test(message);
};

const shouldRetryWithoutJsonMode = ({ status, message, responseMimeType }) => {
  if (!responseMimeType || status !== 400) {
    return false;
  }

  if (isAuthProviderError(status, message) || isModelProviderError(status, message)) {
    return false;
  }

  return /json|mime|response.*schema|generation config|generationConfig|invalid/i.test(message);
};

const shouldRetryWithoutSystemInstruction = ({ status, message, systemInstruction }) => {
  if (!systemInstruction || status !== 400) {
    return false;
  }

  if (isAuthProviderError(status, message) || isModelProviderError(status, message)) {
    return false;
  }

  return /system|instruction|developer|role|contents|invalid|request/i.test(message);
};

const getProviderErrorData = ({ providerStatus, providerMessage }) => {
  if (process.env.NODE_ENV === "production") {
    return { providerStatus };
  }

  return {
    providerStatus,
    providerMessage
  };
};

const buildProviderError = ({ providerStatus, providerMessage }) => {
  const providerData = getProviderErrorData({ providerStatus, providerMessage });

  if (isAuthProviderError(providerStatus, providerMessage)) {
    return new AppError(
      503,
      "AI provider rejected the server API key. Check GEMINI_API_KEY or GOOGLE_API_KEY in your backend environment.",
      "AI_PROVIDER_AUTH",
      providerData
    );
  }

  if (isModelProviderError(providerStatus, providerMessage)) {
    return new AppError(
      503,
      `Gemini model "${getGeminiModel()}" is not available for this API key. Set GEMINI_MODEL to a model enabled in your Google AI Studio account.`,
      "AI_PROVIDER_MODEL",
      providerData
    );
  }

  if (isQuotaProviderError(providerStatus, providerMessage)) {
    return new AppError(
      503,
      "AI provider quota or rate limit reached. Please try again later.",
      "AI_PROVIDER_QUOTA",
      providerData
    );
  }

  if (providerStatus >= 400 && providerStatus < 500) {
    if (isContextProviderError(providerMessage)) {
      return new AppError(
        413,
        "AI provider rejected the request size. Shorten the prompt or reduce saved schema context.",
        "AI_PROVIDER_CONTEXT",
        providerData
      );
    }

    return new AppError(
      502,
      "AI provider rejected this request. The backend retried with relaxed Gemini settings; if this continues, check the prompt, schema, and GEMINI_MODEL.",
      "AI_PROVIDER_REQUEST",
      providerData
    );
  }

  return new AppError(
    503,
    "AI service is temporarily unavailable. Please try again.",
    "AI_PROVIDER_UNAVAILABLE",
    providerData
  );
};

const buildRequestBody = ({
  systemInstruction,
  userPrompt,
  generationConfig,
  includeSystemInstruction = true
}) => {
  const body = {
    contents: [
      {
        role: "user",
        parts: [{ text: userPrompt }]
      }
    ],
    generationConfig
  };

  if (systemInstruction && includeSystemInstruction) {
    body.systemInstruction = {
      parts: [{ text: systemInstruction }]
    };
  }

  return body;
};

const buildPromptWithInlineSystemInstruction = ({ systemInstruction, userPrompt }) => {
  if (!systemInstruction) {
    return userPrompt;
  }

  return [
    "System instructions:",
    systemInstruction.trim(),
    "",
    "User request:",
    userPrompt
  ].join("\n");
};

exports.callGemini = async ({
  systemInstruction,
  userPrompt,
  temperature = 0,
  maxOutputTokens = toPositiveInteger(process.env.GEMINI_MAX_OUTPUT_TOKENS, DEFAULT_MAX_OUTPUT_TOKENS),
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

  const body = buildRequestBody({
    systemInstruction,
    userPrompt,
    generationConfig
  });

  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    throw new AppError(503, "AI service is not configured on server.");
  }

  const apiUrl = getGeminiApiUrl();
  const requestConfig = {
    headers: {
      "x-goog-api-key": apiKey
    }
  };
  let response;

  try {
    response = await axios.post(apiUrl, body, requestConfig);
  } catch (error) {
    const { providerStatus, providerMessage } = getProviderErrorDetails(error);

    logger.error("Gemini request failed", error, {
      providerStatus,
      providerMessage
    });

    const tryWithoutSystemInstruction = async (sourceErrorDetails) => {
      if (
        !shouldRetryWithoutSystemInstruction({
          status: sourceErrorDetails.providerStatus,
          message: sourceErrorDetails.providerMessage,
          systemInstruction
        })
      ) {
        throw buildProviderError(sourceErrorDetails);
      }

      const inlineSystemPrompt = buildPromptWithInlineSystemInstruction({
        systemInstruction,
        userPrompt
      });
      const inlineGenerationConfig = {
        ...generationConfig
      };
      delete inlineGenerationConfig.responseMimeType;

      try {
        response = await axios.post(
          apiUrl,
          buildRequestBody({
            userPrompt: inlineSystemPrompt,
            generationConfig: inlineGenerationConfig,
            includeSystemInstruction: false
          }),
          requestConfig
        );
      } catch (inlineRetryError) {
        const inlineRetryDetails = getProviderErrorDetails(inlineRetryError);

        logger.error("Gemini inline system-instruction retry failed", inlineRetryError, inlineRetryDetails);
        throw buildProviderError(inlineRetryDetails);
      }
    };

    if (shouldRetryWithoutJsonMode({ status: providerStatus, message: providerMessage, responseMimeType })) {
      const relaxedBody = {
        ...body,
        generationConfig: {
          ...body.generationConfig
        }
      };
      delete relaxedBody.generationConfig.responseMimeType;

      try {
        response = await axios.post(apiUrl, relaxedBody, requestConfig);
      } catch (retryError) {
        const retryDetails = getProviderErrorDetails(retryError);

        logger.error("Gemini relaxed JSON retry failed", retryError, retryDetails);
        await tryWithoutSystemInstruction(retryDetails);
      }
    } else {
      await tryWithoutSystemInstruction({ providerStatus, providerMessage });
    }
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
