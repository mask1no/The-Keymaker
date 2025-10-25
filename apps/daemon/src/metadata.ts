import { logger } from "@keymaker/logger";

export type UploadResult = { imageUri: string; metadataUri: string };

/**
 * Upload image+metadata to Arweave via Irys if configured; otherwise
 * accept provided URIs and return them.
 *
 * Inputs: either
 *  - { imageUri, metadataUri } passthrough (no upload), or
 *  - { imageBase64, name, symbol, description, attributes? } (requires Irys)
 */
export async function uploadImageAndJson(payload: any): Promise<UploadResult> {
  const hasIrys = !!process.env.IRYS_NODE && !!process.env.IRYS_PRIVATE_KEY;
  const { imageUri, metadataUri } = payload || {};
  if (!hasIrys) {
    if (imageUri && metadataUri) return { imageUri, metadataUri };
    throw new Error("IRYS_NOT_CONFIGURED");
  }
  // Placeholder for future Irys integration. To keep minimal deps and avoid
  // runtime failures when IRYS_* are set incorrectly, we currently require
  // direct URIs or a future plugin providing the upload implementation.
  logger.warn("irys-upload-unimplemented", { note: "Falling back to passthrough only" });
  if (imageUri && metadataUri) return { imageUri, metadataUri };
  throw new Error("IRYS_UPLOAD_UNIMPLEMENTED");
}


