import { ImageUpIcon, SearchIcon, SparklesIcon, DatabaseIcon } from "lucide-react";

export const Header = () => (
  <div className="flex flex-col gap-8 sm:gap-12">
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <ImageUpIcon className="size-5 text-primary" />
        <h1 className="text-xl font-semibold tracking-tight">Pretraga</h1>
      </div>
      <p className="text-balance text-muted-foreground">
        Natural language image search powered by AI. Upload images and search them using plain text.
      </p>
      <p className="text-muted-foreground text-sm italic">
        Try searching for "water" or "desert".
      </p>
    </div>
    <ul className="flex flex-col gap-3 text-muted-foreground">
      <li className="flex items-start gap-3">
        <SparklesIcon className="mt-0.5 size-4 shrink-0 text-primary" />
        <p className="text-sm">AI-powered image descriptions</p>
      </li>
      <li className="flex items-start gap-3">
        <SearchIcon className="mt-0.5 size-4 shrink-0 text-primary" />
        <p className="text-sm">Natural language search</p>
      </li>
      <li className="flex items-start gap-3">
        <DatabaseIcon className="mt-0.5 size-4 shrink-0 text-primary" />
        <p className="text-sm">Vector-based indexing</p>
      </li>
    </ul>
  </div>
);
