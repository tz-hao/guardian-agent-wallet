export type NormalizedCawError = {
  status?: number;
  code?: string;
  message: string;
  details?: unknown;
  safeDetails?: Record<string, unknown>;
};

const REDACTED = "[REDACTED]";
const SENSITIVE_KEY_PATTERN = /api[-_]?key|authorization|bearer|token|secret|password|credential/i;
const MESSAGE_KEYS = ["message", "reason", "error", "detail", "description", "suggestion"];

export function normalizeCawError(error: unknown): NormalizedCawError {
  if (typeof error === "string") {
    return { message: redactString(error) || "CAW SDK validation error." };
  }

  const source = asRecord(error);
  if (!source) {
    return { message: "CAW SDK validation error." };
  }

  const hasResponseLikePayload =
    "response" in source ||
    "data" in source ||
    "body" in source ||
    "details" in source ||
    "errors" in source ||
    "reason" in source ||
    "code" in source ||
    "suggestion" in source;

  if (error instanceof Error && !hasResponseLikePayload) {
    return {
      message: redactString(error.message) || "CAW SDK validation error.",
      details: sanitizeForDetails({ name: error.name }),
      safeDetails: {},
    };
  }

  const response = asRecord(source.response);
  const status = toNumber(response?.status ?? source.status);
  const body = response?.data ?? response?.body ?? source.data ?? source.body ?? source.error ?? source;
  const bodyRecord = asRecord(body);
  const nestedError = asRecord(bodyRecord?.error);
  const nestedDetails =
    bodyRecord?.details ??
    nestedError?.details ??
    bodyRecord?.errors ??
    nestedError?.errors ??
    source.details ??
    source.errors;
  const code = stringifyMessage(
    bodyRecord?.code ?? nestedError?.code ?? bodyRecord?.cawCode ?? nestedError?.cawCode ?? source.code,
  );
  const reason = stringifyMessage(
    nestedError?.reason ??
      nestedError?.message ??
      bodyRecord?.reason ??
      bodyRecord?.message ??
      bodyRecord?.error ??
      source.reason ??
      source.message,
  );
  const fallbackReason = findMessage(body);
  const suggestion = stringifyMessage(bodyRecord?.suggestion ?? nestedError?.suggestion ?? source.suggestion);
  const message = redactString([reason || fallbackReason || "CAW SDK validation error.", suggestion].filter(Boolean).join(" "));
  const safeDetails = buildSafeDetails({ code, reason: reason || fallbackReason, suggestion, details: nestedDetails, body });

  return {
    status,
    code,
    message,
    details: sanitizeForDetails(nestedDetails ?? body),
    safeDetails,
  };
}

function buildSafeDetails({
  code,
  reason,
  suggestion,
  details,
  body,
}: {
  code?: string;
  reason?: string;
  suggestion?: string;
  details: unknown;
  body: unknown;
}) {
  const detailRecord = asRecord(details);
  const bodyRecord = asRecord(body);
  const nestedError = asRecord(bodyRecord?.error);
  const safeDetails: Record<string, unknown> = {};

  if (code) safeDetails.cawCode = redactString(code);
  if (reason) safeDetails.reason = redactString(reason);
  if (suggestion) safeDetails.suggestion = redactString(suggestion);

  const fieldErrors =
    detailRecord?.fieldErrors ??
    detailRecord?.field_errors ??
    bodyRecord?.fieldErrors ??
    bodyRecord?.field_errors ??
    nestedError?.fieldErrors ??
    nestedError?.field_errors ??
    bodyRecord?.errors ??
    nestedError?.errors;

  if (fieldErrors) {
    safeDetails.fieldErrors = sanitizeForDetails(fieldErrors);
  }

  const sanitizedDetails = sanitizeForDetails(details);
  if (sanitizedDetails && Object.keys(safeDetails).length < 4) {
    safeDetails.details = sanitizedDetails;
  }

  return safeDetails;
}

function findMessage(value: unknown, depth = 0): string {
  if (depth > 5 || value == null) return "";
  if (typeof value === "string") return redactString(value);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    return value.map((item) => findMessage(item, depth + 1)).find(Boolean) || "";
  }

  const record = asRecord(value);
  if (!record) return "";

  for (const key of MESSAGE_KEYS) {
    const message = stringifyMessage(record[key]);
    if (message) return redactString(message);
  }

  for (const nested of Object.values(record)) {
    const message = findMessage(nested, depth + 1);
    if (message) return message;
  }

  return "";
}

function stringifyMessage(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return redactString(value);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    return value.map((item) => stringifyMessage(item)).filter(Boolean).join("; ");
  }

  const record = asRecord(value);
  if (!record) return "";

  const pairs = Object.entries(record)
    .map(([key, nested]) => {
      const message = stringifyMessage(nested);
      return message ? `${key}: ${message}` : "";
    })
    .filter(Boolean);

  return redactString(pairs.join("; "));
}

function sanitizeForDetails(value: unknown, depth = 0): unknown {
  if (depth > 6) return "[Max depth reached]";
  if (value == null) return value;
  if (typeof value === "string") return redactString(value);
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.map((item) => sanitizeForDetails(item, depth + 1));

  const record = asRecord(value);
  if (!record) return String(value);

  return Object.fromEntries(
    Object.entries(record).map(([key, nested]) => [
      key,
      SENSITIVE_KEY_PATTERN.test(key) ? REDACTED : sanitizeForDetails(nested, depth + 1),
    ]),
  );
}

function redactString(value: string) {
  return value
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, `Bearer ${REDACTED}`)
    .replace(/(AGENT_WALLET_API_KEY\s*[=:]\s*)[^\s,;}]+/gi, `$1${REDACTED}`)
    .replace(/(api[-_]?key\s*[=:]\s*)[^\s,;}]+/gi, `$1${REDACTED}`)
    .replace(/(authorization\s*[=:]\s*)[^\s,;}]+/gi, `$1${REDACTED}`);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function toNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}
