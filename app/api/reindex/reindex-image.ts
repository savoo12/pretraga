/** biome-ignore-all lint/suspicious/noConsole: "Handy for debugging" */

import type { PutBlobResult } from "@vercel/blob";
import { FatalError } from "workflow";
import { generateDescription } from "../upload/generate-description";
import { indexImage } from "../upload/index-image";

type BlobInfo = Pick<
  PutBlobResult,
  "url" | "downloadUrl" | "pathname" | "contentType" | "contentDisposition"
>;

export const reindexImage = async (blobInfo: BlobInfo) => {
  "use workflow";

  const workflowStartTime = Date.now();

  // Create a PutBlobResult-like object from the blob info
  const blob: PutBlobResult = {
    url: blobInfo.url,
    downloadUrl: blobInfo.downloadUrl,
    pathname: blobInfo.pathname,
    contentType: blobInfo.contentType,
    contentDisposition: blobInfo.contentDisposition,
  };

  try {
    console.log(
      `[REINDEX] Starting reindex workflow for ${blob.pathname}`
    );

    // Step 1: Generate description using AI
    console.log("[REINDEX] Step 1/2: Generating description");
    const text = await generateDescription(blob);
    console.log(
      `[REINDEX] Step 1/2 complete. Generated ${text.length} characters`
    );

    // Step 2: Index in search with metadata
    console.log("[REINDEX] Step 2/2: Indexing in search");
    await indexImage(blob, text);
    console.log("[REINDEX] Step 2/2 complete. Image indexed successfully");

    const workflowDuration = Date.now() - workflowStartTime;
    console.log(
      `[REINDEX] Successfully reindexed image ${blob.pathname} in ${workflowDuration}ms`
    );

    return {
      success: true,
      pathname: blob.pathname,
      processingTime: workflowDuration,
    };
  } catch (error) {
    const workflowDuration = Date.now() - workflowStartTime;
    const message = error instanceof Error ? error.message : "Unknown error";
    const isFatal = error instanceof FatalError;

    console.error(
      `[REINDEX] ${isFatal ? "Fatal" : "Retryable"} error after ${workflowDuration}ms:`,
      message
    );

    throw error;
  }
};
