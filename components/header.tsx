import { SearchIcon } from "lucide-react";

export function Header() {
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
    <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
      <p className="font-medium">How it works:</p>
      <ol className="mt-2 space-y-1 text-left text-xs">
        <li>1. Upload images (drag & drop or click)</li>
        <li>2. AI generates descriptions automatically</li>
        <li>3. Search with natural language queries</li>
      </ol>
    </div>
  </div>
  );
}
