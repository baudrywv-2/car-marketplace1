"use client";

import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";

const MAX_IMAGES = 4;
const MAX_SIZE_MB = 3;

type Props = {
  value: string[];
  onChange: (urls: string[]) => void;
  disabled?: boolean;
};

export default function ImageUpload({ value, onChange, disabled }: Props) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [pasteUrl, setPasteUrl] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length || value.length >= MAX_IMAGES) return;

    setUploadError("");
    setUploading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setUploadError("Log in to upload images.");
      setUploading(false);
      return;
    }

    const toAdd: string[] = [];
    const remaining = MAX_IMAGES - value.length;
    const count = Math.min(files.length, remaining);

    for (let i = 0; i < count; i++) {
      const file = files[i];
      if (!file?.type.startsWith("image/")) continue;
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setUploadError(`Image too large (max ${MAX_SIZE_MB} MB each).`);
        continue;
      }

      const ext = file.name.split(".").pop() || "jpg";
      const path = `users/${user.id}/${Date.now()}-${i}.${ext}`;

      const { error } = await supabase.storage.from("car-images").upload(path, file, { upsert: true });
      if (error) {
        setUploadError(error.message);
        break;
      }

      const { data: { publicUrl } } = supabase.storage.from("car-images").getPublicUrl(path);
      toAdd.push(publicUrl);
    }

    if (toAdd.length) onChange([...value, ...toAdd].slice(0, MAX_IMAGES));
    setUploading(false);
    e.target.value = "";
  }

  function handleRemove(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  function moveImage(idx: number, dir: -1 | 1) {
    const next = idx + dir;
    if (next < 0 || next >= value.length) return;
    const arr = [...value];
    [arr[idx], arr[next]] = [arr[next], arr[idx]];
    onChange(arr);
  }

  function handleAddUrl() {
    const url = pasteUrl.trim();
    if (!url || value.length >= MAX_IMAGES) return;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      setUploadError("Enter a valid URL starting with http:// or https://");
      return;
    }
    onChange([...value, url].slice(0, MAX_IMAGES));
    setPasteUrl("");
    setUploadError("");
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          type="button"
          disabled={disabled || uploading || value.length >= MAX_IMAGES}
          onClick={() => inputRef.current?.click()}
          className="rounded border border-zinc-300 px-3 py-1.5 text-[10px] font-medium hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
        >
          {uploading ? "Uploading…" : "Upload images"}
        </button>
        <span className="text-[10px] text-zinc-500">
          {value.length}/{MAX_IMAGES} · max {MAX_SIZE_MB} MB each
        </span>
      </div>
      {uploadError && <p className="text-[10px] text-red-600">{uploadError}</p>}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((url, idx) => (
            <div key={`${url}-${idx}`} className="relative flex flex-col items-center">
              <img
                src={url}
                alt=""
                className="h-16 w-16 rounded border border-zinc-200 object-cover dark:border-zinc-600"
              />
              <div className="mt-1 flex gap-0.5">
                <button
                  type="button"
                  disabled={disabled || idx === 0}
                  onClick={() => moveImage(idx, -1)}
                  className="rounded bg-[var(--border)] px-1.5 py-0.5 text-[10px] disabled:opacity-40"
                  title="Move earlier (first image = main)"
                  aria-label="Move earlier"
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={disabled || idx === value.length - 1}
                  onClick={() => moveImage(idx, 1)}
                  className="rounded bg-[var(--border)] px-1.5 py-0.5 text-[10px] disabled:opacity-40"
                  title="Move later"
                  aria-label="Move later"
                >
                  ↓
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => handleRemove(idx)}
                  className="rounded bg-red-500 px-1.5 py-0.5 text-[10px] text-white hover:bg-red-600 disabled:opacity-50"
                  aria-label="Remove"
                >
                  ×
                </button>
              </div>
              {idx === 0 && <span className="mt-0.5 text-[8px] text-[var(--muted-foreground)]">Main</span>}
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          type="url"
          value={pasteUrl}
          onChange={(e) => setPasteUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddUrl())}
          placeholder="Or paste image URL"
          disabled={disabled || value.length >= MAX_IMAGES}
          className="flex-1 rounded border border-zinc-300 px-2 py-1.5 text-[10px] dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
        />
        <button
          type="button"
          disabled={disabled || !pasteUrl.trim() || value.length >= MAX_IMAGES}
          onClick={handleAddUrl}
          className="rounded border border-zinc-300 px-2 py-1.5 text-[10px] font-medium hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
        >
          Add URL
        </button>
      </div>
    </div>
  );
}
