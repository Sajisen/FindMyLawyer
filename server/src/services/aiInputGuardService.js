const MIN_DESCRIPTION_LENGTH = 20;
const MAX_DESCRIPTION_LENGTH = 2000;

function normalizeWhitespace(value = "") {
  return String(value).replace(/\r\n?/g, "\n").replace(/[\t ]+/g, " ").trim();
}

function countLetters(value) {
  return value.match(/\p{L}/gu)?.length || 0;
}

function looksLikeCodeOrMarkup(value) {
  const strongSignals = [
    /<\s*(?:script|html|body|div|span|form|input|button|style|iframe)\b/i,
    /```(?:javascript|js|typescript|ts|html|css|python|java|c\+\+|c#|sql)?/i,
    /\bSELECT\s+.+\s+FROM\b/is,
  ];

  if (strongSignals.some((pattern) => pattern.test(value))) {
    return true;
  }

  const weakerSignals = [
    /\b(?:function|const|let|var|import|export)\s+[A-Za-z_$][\w$]*/,
    /=>/,
    /\b(?:document|window|console)\.[A-Za-z_$][\w$]*/,
    /\{\s*[A-Za-z_$][\w$]*\s*:/,
    /\b(?:npm|node|git|curl)\s+(?:install|run|clone|commit|push)\b/i,
  ];

  return weakerSignals.filter((pattern) => pattern.test(value)).length >= 2;
}

function looksLikeRepeatedNoise(value) {
  const compact = value.toLowerCase().replace(/\s+/g, "");

  if (!compact) {
    return true;
  }

  if (/(.)\1{11,}/u.test(compact)) {
    return true;
  }

  const letters = compact.match(/\p{L}/gu) || [];

  if (letters.length < 12) {
    return false;
  }

  const uniqueLetters = new Set(letters).size;
  return uniqueLetters <= 3;
}

export function inspectAIInput(rawDescription) {
  const description = normalizeWhitespace(rawDescription);

  if (description.length < MIN_DESCRIPTION_LENGTH) {
    return {
      ok: false,
      statusCode: 400,
      message: "Please describe the situation in a little more detail.",
    };
  }

  if (description.length > MAX_DESCRIPTION_LENGTH) {
    return {
      ok: false,
      statusCode: 400,
      message: `The description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer.`,
    };
  }

  if (countLetters(description) < 10 || looksLikeRepeatedNoise(description)) {
    return {
      ok: false,
      statusCode: 400,
      message:
        "The description does not contain enough readable information to analyze.",
    };
  }

  if (looksLikeCodeOrMarkup(description)) {
    return {
      ok: false,
      statusCode: 400,
      message:
        "Please describe the legal situation in plain language instead of sending code or markup.",
    };
  }

  return {
    ok: true,
    description,
  };
}

export const AI_INPUT_LIMITS = {
  min: MIN_DESCRIPTION_LENGTH,
  max: MAX_DESCRIPTION_LENGTH,
};
