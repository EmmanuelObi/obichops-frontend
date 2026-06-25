const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;

const MAX_BYTES = 5 * 1024 * 1024;

export function validateExcessPaymentFile(file: File): string | null {
  if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
    return "Upload a JPEG, PNG, WebP image, or PDF.";
  }
  if (file.size > MAX_BYTES) {
    return "File must be 5 MB or smaller.";
  }
  return null;
}

export async function uploadExcessPaymentProof(
  orderId: string,
  file: File,
  token: string,
): Promise<void> {
  const validationError = validateExcessPaymentFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const presignResponse = await fetch(
    `${API_BASE_URL}/orders/me/${orderId}/excess-payment-proof/upload-url`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filename: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
      }),
    },
  );

  const presignPayload = await presignResponse.json().catch(() => null);
  if (!presignResponse.ok) {
    throw new Error(
      (presignPayload as { error?: string } | null)?.error ??
        "Could not start upload",
    );
  }

  const { storageKey, uploadUrl } = presignPayload as {
    storageKey: string;
    uploadUrl: string;
  };

  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
      "Content-Length": String(file.size),
    },
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new Error("Upload to storage failed");
  }

  const confirmResponse = await fetch(
    `${API_BASE_URL}/orders/me/${orderId}/excess-payment-proof/confirm`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        storageKey,
        filename: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
      }),
    },
  );

  const confirmPayload = await confirmResponse.json().catch(() => null);
  if (!confirmResponse.ok) {
    throw new Error(
      (confirmPayload as { error?: string } | null)?.error ??
        "Could not save payment proof",
    );
  }
}

export async function openExcessPaymentProof(
  path: string,
  token: string,
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      (payload as { error?: string } | null)?.error ?? "Could not open proof",
    );
  }
  const { downloadUrl } = payload as { downloadUrl: string };
  window.open(downloadUrl, "_blank", "noopener,noreferrer");
}
