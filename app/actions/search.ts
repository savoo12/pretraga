/** biome-ignore-all lint/suspicious/noConsole: "Handy for debugging" */

"use server";

import { Search } from "@upstash/search";
import type { PutBlobResult } from "@vercel/blob";

const upstash = Search.fromEnv();
const index = upstash.index("images");

type SearchResponse =
  | {
      data: PutBlobResult[];
    }
  | {
      error: string;
    };

export const search = async (
  _prevState: SearchResponse | undefined,
  formData: FormData
): Promise<SearchResponse> => {
  const query = formData.get("search");

  if (!query || typeof query !== "string") {
    return { error: "Please enter a search query" };
  }

  try {
    console.log("[v0] Searching index for query:", query);
    const results = await index.search({ query });

    console.log("[v0] Search results count:", results.length);
    console.log("[v0] Raw results:", JSON.stringify(results, null, 2));
    
    const data = results
      .sort((a, b) => b.score - a.score)
      .map((result) => result.metadata)
      .filter(Boolean) as unknown as PutBlobResult[];

    console.log("[v0] Filtered images count:", data.length);
    console.log("[v0] Image URLs:", data.map(d => d.url));
    
    return { data };
  } catch (error) {
    console.error("[v0] Search error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";

    return { error: message };
  }
};
