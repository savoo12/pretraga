/** biome-ignore-all lint/suspicious/noConsole: "Handy for debugging" */

import { list } from "@vercel/blob";
import { NextResponse } from "next/server";
import { start } from "workflow/api";
import { reindexImage } from "./reindex-image";

export const POST = async (): Promise<NextResponse> => {
  try {
    console.log("[REINDEX] Starting reindex of all images...");

    // Get all blobs from storage
    const { blobs } = await list();

    if (blobs.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No images found to reindex",
        count: 0,
      });
    }

    console.log(`[REINDEX] Found ${blobs.length} images to reindex`);

    // Start a workflow for each image
    const results = await Promise.allSettled(
      blobs.map((blob) =>
        start(reindexImage, [
          {
            url: blob.url,
            downloadUrl: blob.downloadUrl,
            pathname: blob.pathname,
            contentType: blob.contentType,
            contentDisposition: blob.contentDisposition,
          },
        ])
      )
    );

    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    console.log(
      `[REINDEX] Started ${successful} workflows, ${failed} failed to start`
    );

    return NextResponse.json({
      success: true,
      message: `Started reindexing ${successful} images`,
      total: blobs.length,
      started: successful,
      failed,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[REINDEX] Error:", message);

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
};
