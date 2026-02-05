"use client";

import { ImageIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

type PreviewProps = {
  url: string;
  priority?: boolean;
};

export const Preview = ({ url, priority }: PreviewProps) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if it's a temporary blob URL (created by URL.createObjectURL)
  const isTempBlobUrl = url.startsWith("blob:");

  if (hasError) {
    return (
      <div className="mb-4 rounded-xl bg-card p-2 shadow-xl">
        <div className="flex aspect-square items-center justify-center rounded-md bg-muted">
          <ImageIcon className="size-8 text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4 rounded-xl bg-card p-2 shadow-xl">
      {isLoading && (
        <div className="absolute inset-2 animate-pulse rounded-md bg-muted" />
      )}
      {isTempBlobUrl ? (
        // For temporary blob URLs, use a regular img tag
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt="Uploaded image"
          className="rounded-md h-auto w-full"
          src={url}
          onError={() => setHasError(true)}
          onLoad={() => setIsLoading(false)}
        />
      ) : (
        <Image
          alt="Image"
          className="rounded-md h-auto w-full"
          height={630}
          priority={priority}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          src={url}
          width={630}
          unoptimized
          onError={() => setHasError(true)}
          onLoad={() => setIsLoading(false)}
        />
      )}
    </div>
  );
};
