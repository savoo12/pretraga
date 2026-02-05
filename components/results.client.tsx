"use client";

import type { ListBlobResult, PutBlobResult } from "@vercel/blob";
import {
  ArrowLeftIcon,
  FileIcon,
  ImageIcon,
  ImageUpIcon,
  Loader2Icon,
  SearchIcon,
  UploadIcon,
  XIcon,
} from "lucide-react";
import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { search } from "@/app/actions/search";
import { Preview } from "./preview";
import { Button } from "./ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "./ui/empty";
import { Input } from "./ui/input";
import { Progress } from "./ui/progress";
import { useUploadedImages } from "./uploaded-images-provider";

type ResultsClientProps = {
  defaultData: ListBlobResult["blobs"];
};

const PRIORITY_COUNT = 12;

export const ResultsClient = ({ defaultData }: ResultsClientProps) => {
  const { images, addImage } = useUploadedImages();
  const [state, formAction, isPending] = useActionState(search, undefined);
  const [hasSearched, setHasSearched] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ completed: 0, total: 0 });
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (state) {
      if ("error" in state) {
        toast.error(state.error);
      } else if ("data" in state) {
        setHasSearched(true);
        console.log("[v0] Search completed, results:", state.data.length);
        if (state.data.length === 0) {
          toast.info("No images found matching your search. Images need AI-generated descriptions to be searchable.");
        }
      }
    }
  }, [state]);

  const reset = () => {
    setHasSearched(false);
    window.location.reload();
  };

  const processFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) return;

    const maxSize = 4.5 * 1024 * 1024;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    
    const validFiles = files.filter((file) => {
      if (!allowedTypes.includes(file.type)) {
        toast.error(`${file.name}: Invalid file type. Use JPEG, PNG, or WebP.`);
        return false;
      }
      if (file.size > maxSize) {
        toast.error(`${file.name}: File exceeds 4.5MB limit.`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    abortControllerRef.current = new AbortController();
    setIsUploading(true);
    setUploadProgress({ completed: 0, total: validFiles.length });

    const tempBlobs = validFiles.map((file) => {
      const tempUrl = URL.createObjectURL(file);
      return {
        file,
        tempUrl,
        blob: {
          url: tempUrl,
          downloadUrl: tempUrl,
          pathname: file.name,
          contentType: file.type,
          contentDisposition: `attachment; filename="${file.name}"`,
        } as PutBlobResult,
      };
    });

    for (const { blob } of tempBlobs) {
      addImage(blob);
    }

    const BATCH_SIZE = 5;
    let completed = 0;
    const results: PromiseSettledResult<{ success: boolean; fileName: string }>[] = [];

    try {
      for (let i = 0; i < tempBlobs.length; i += BATCH_SIZE) {
        if (abortControllerRef.current?.signal.aborted) break;

        const batch = tempBlobs.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.allSettled(
          batch.map(async ({ file, tempUrl }) => {
            try {
              const formData = new FormData();
              formData.append("file", file);

              const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
                signal: abortControllerRef.current?.signal,
              });

              if (!response.ok) {
                const error = (await response.json()) as { error: string };
                throw new Error(error.error);
              }

              return { success: true, fileName: file.name };
            } finally {
              URL.revokeObjectURL(tempUrl);
            }
          })
        );

        results.push(...batchResults);
        completed += batch.length;
        setUploadProgress({ completed, total: validFiles.length });
      }
    } finally {
      abortControllerRef.current = null;
      setIsUploading(false);
      setUploadProgress({ completed: 0, total: 0 });

      const successful = results.filter((r) => r.status === "fulfilled");
      const failed = results.filter((r) => r.status === "rejected");

      if (successful.length > 0) {
        toast.success(`${successful.length} image${successful.length > 1 ? "s" : ""} uploaded successfully`);
      }

      if (failed.length > 0) {
        toast.error(`Failed to upload ${failed.length} image${failed.length > 1 ? "s" : ""}`);
      }
    }
  }, [addImage]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith("image/")
    );
    processFiles(files);
  }, [processFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);
    if (inputRef.current) inputRef.current.value = "";
  }, [processFiles]);

  const cancelUpload = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      toast.info("Upload cancelled");
    }
  }, []);

  const hasImages =
    images.length > 0 ||
    defaultData.length > 0 ||
    (state && "data" in state && state.data?.length > 0);

  return (
    <div
      className="relative min-h-[50vh]"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />

      {isDragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center rounded-xl border-2 border-dashed border-primary bg-primary/5 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2 text-primary">
            <UploadIcon className="size-12" />
            <p className="text-lg font-medium">Drop images here</p>
          </div>
        </div>
      )}

      {isUploading && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 lg:ml-[182px]">
          <div className="flex items-center gap-3 rounded-full bg-background px-4 py-2 shadow-lg border">
            <Loader2Icon className="size-4 animate-spin" />
            <span className="text-sm">
              Uploading {uploadProgress.completed}/{uploadProgress.total}
            </span>
            <Progress className="w-24" value={(uploadProgress.completed / uploadProgress.total) * 100} />
            <Button size="icon" variant="ghost" className="size-6" onClick={cancelUpload}>
              <XIcon className="size-3" />
            </Button>
          </div>
        </div>
      )}

      {hasImages ? (
        <div className="gap-4 sm:columns-2 md:columns-3 lg:columns-2 xl:columns-3">
          {images.map((image, index) => (
            <Preview
              key={image.url}
              priority={index < PRIORITY_COUNT}
              url={image.url}
            />
          ))}
          {hasSearched && state && "data" in state
            ? (state.data.length > 0 
                ? state.data.map((blob, index) => (
                    <Preview
                      key={blob.url}
                      priority={index < PRIORITY_COUNT}
                      url={blob.url}
                    />
                  ))
                : null // No results message is shown via toast
              )
            : defaultData.map((blob, index) => (
                <Preview
                  key={blob.url}
                  priority={index < PRIORITY_COUNT}
                  url={blob.downloadUrl}
                />
              ))}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full cursor-pointer"
          disabled={isUploading}
        >
          <Empty className="h-full min-h-[50vh] rounded-lg border border-dashed hover:border-primary hover:bg-muted/50 transition-colors">
            <EmptyHeader className="max-w-none">
              <div className="relative isolate mb-8 flex">
                <div className="-rotate-12 translate-x-2 translate-y-2 rounded-full border bg-background p-3 shadow-xs">
                  <ImageIcon className="size-5 text-muted-foreground" />
                </div>
                <div className="z-10 rounded-full border bg-background p-3 shadow-xs">
                  <UploadIcon className="size-5 text-muted-foreground" />
                </div>
                <div className="-translate-x-2 translate-y-2 rotate-12 rounded-full border bg-background p-3 shadow-xs">
                  <FileIcon className="size-5 text-muted-foreground" />
                </div>
              </div>
              <EmptyTitle>Drop images here or click to upload</EmptyTitle>
              <EmptyDescription>
                Supports JPEG, PNG, and WebP (max 4.5MB per file)
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </button>
      )}

      <form
        action={formAction}
        className="-translate-x-1/2 fixed bottom-8 left-1/2 flex w-full max-w-sm items-center gap-1 rounded-full bg-background p-1 shadow-xl border sm:max-w-lg lg:ml-[182px]"
      >
        {hasSearched && (
          <Button
            className="shrink-0 rounded-full"
            disabled={isPending}
            onClick={reset}
            size="icon"
            type="button"
            variant="ghost"
          >
            <ArrowLeftIcon className="size-4" />
          </Button>
        )}
        <Input
          className="w-full rounded-full border-none bg-secondary shadow-none outline-none"
          disabled={isPending || !hasImages}
          id="search"
          name="search"
          placeholder="Search images by description..."
          required
        />
        <Button
          className="shrink-0 rounded-full"
          disabled={isPending || !hasImages}
          size="icon"
          type="submit"
          variant="default"
        >
          {isPending ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <SearchIcon className="size-4" />
          )}
        </Button>
        <Button
          className="shrink-0 rounded-full"
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
          size="icon"
          type="button"
          variant="ghost"
        >
          <ImageUpIcon className="size-4" />
        </Button>
      </form>
    </div>
  );
};
