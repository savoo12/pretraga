"use client";

import { RefreshCwIcon, SearchIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";

export function Header() {
  const [isReindexing, setIsReindexing] = useState(false);

  const handleReindex = async () => {
    setIsReindexing(true);
    try {
      const response = await fetch("/api/reindex", { method: "POST" });
      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "Reindexing started");
      } else {
        toast.error(data.error || "Failed to start reindexing");
      }
    } catch {
      toast.error("Failed to connect to server");
    } finally {
      setIsReindexing(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <SearchIcon className="size-5" />
          <h1 className="text-xl font-semibold tracking-tight">Image Search</h1>
        </div>
        <p className="text-balance text-muted-foreground">
          Upload images and search them using natural language. Drag and drop or click to upload.
        </p>
      </div>
      <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        <p className="font-medium text-center">How it works:</p>
        <ol className="mt-2 space-y-1 text-left text-xs">
          <li>1. Upload images (drag & drop or click)</li>
          <li>2. AI generates descriptions automatically</li>
          <li>3. Search with natural language queries</li>
        </ol>
        <div className="mt-4 border-t pt-4">
          <Button
            onClick={handleReindex}
            disabled={isReindexing}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <RefreshCwIcon className={`size-4 mr-2 ${isReindexing ? "animate-spin" : ""}`} />
            {isReindexing ? "Reindexing..." : "Reindex All Images"}
          </Button>
          <p className="mt-2 text-xs text-center">
            Use this if images were uploaded before AI was configured
          </p>
        </div>
      </div>
    </div>
  );
}
