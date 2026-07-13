const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export async function downloadAuthenticatedFile(
  path: string,
  token: string,
  fallbackFilename: string,
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const text = await response.text();
    let message = "Download failed";
    try {
      const payload = JSON.parse(text) as { error?: string; message?: string };
      message = payload.error ?? payload.message ?? message;
    } catch {
      message = text || message;
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition");
  let filename =
    disposition?.match(/filename="([^"]+)"/)?.[1] ?? fallbackFilename;

  // Ensure the download keeps a usable extension even if headers are stripped.
  if (!/\.\w+$/.test(filename) && /\.\w+$/.test(fallbackFilename)) {
    filename = fallbackFilename;
  }

  const contentType =
    response.headers.get("Content-Type") ?? blob.type ?? "application/octet-stream";
  const typedBlob =
    blob.type === contentType
      ? blob
      : new Blob([blob], { type: contentType.split(";")[0]?.trim() || contentType });

  const url = URL.createObjectURL(typedBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
