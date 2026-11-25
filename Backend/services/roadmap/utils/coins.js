const fail = (status, message) =>
  Object.assign(new Error(message), { status });

async function call(path, body) {
  // Read env variables when the function executes
  const BILLING_SERVICE_URL = process.env.BILLING_SERVICE_URL;
  const INTERNAL_SERVICE_KEY = process.env.INTERNAL_SERVICE_KEY;

  if (!BILLING_SERVICE_URL || !INTERNAL_SERVICE_KEY) {
    throw fail(500, "Billing service configuration is missing");
  }

  let res;

  try {
    res = await fetch(
      `${BILLING_SERVICE_URL.replace(/\/$/, "")}${path}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-key": INTERNAL_SERVICE_KEY,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(8000),
      }
    );
  } catch (error) {
    console.error("Billing connection error:", error.message);
    throw fail(503, "Billing service unavailable");
  }

  const data = await res.json().catch(() => ({}));

  if (res.status === 402) {
    throw fail(402, data.message || "Not enough interview coins");
  }

  if (!res.ok) {
    console.error("Billing API error:", res.status, data);
    throw fail(502, data.message || "Billing service error");
  }

  return data;
}

export const deductCoins = ({
  userId,
  amount,
  referenceId,
}) => {
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw fail(400, "Invalid coin amount");
  }

  return call("/internal/coins/deduct", {
    userId,
    amount,
    reason: "ROADMAP_GENERATION",
    referenceId,
  });
};

export const refundCoins = ({
  userId,
  amount,
  referenceId,
}) => {
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw fail(400, "Invalid refund amount");
  }

  return call("/internal/coins/refund", {
    userId,
    amount,
    reason: "ROADMAP_FAILED",
    referenceId,
  }).catch((error) => {
    console.error(
      "Refund failed, manual check needed:",
      referenceId,
      error.message
    );
    throw error;
  });
};