"use client";

import { useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useLocale } from "@/app/contexts/LocaleContext";

const MAX_IMAGES = 4;
const MAX_SIZE_MB = 3;
const COMPRESS_MAX_EDGE = 1600;
const COMPRESS_QUALITY = 0.82;

type Props = {
  value: string[];
  onChange: (urls: string[]) => void;
  disabled?: boolean;
};

/** Resize/compress large photos client-side before upload (JPEG). */
async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  if (file.size <= 800 * 1024) return file;

  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;

  const scale = Math.min(1, COMPRESS_MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", COMPRESS_QUALITY)
  );
  if (!blob || blob.size >= file.size) return file;

  const base = file.name.replace(/\.[^.]+$/, "") || "photo";
  return new File([blob], `${base}.jpg`, { type: "image/jpeg", lastModified: Date.now() });
}

export default function ImageUpload({ value, onChange, disabled }: Props) {
  const { t } = useLocale();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [pasteUrl, setPasteUrl] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const files = Array.from(fileList);
      if (!files.length || value.length >= MAX_IMAGES || disabled) return;

      setUploadError("");
      setUploading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setUploadError(t("loginToUploadImages"));
        setUploading(false);
        setUploadProgress(null);
        return;
      }

      const toAdd: string[] = [];
      const remaining = MAX_IMAGES - value.length;
      const candidates = files
        .filter((f) => f.type.startsWith("image/"))
        .slice(0, remaining);
      const total = candidates.length;

      if (total === 0) {
        setUploading(false);
        return;
      }

      for (let i = 0; i < candidates.length; i++) {
        setUploadProgress({ current: i + 1, total });
        const raw = candidates[i];

        let file = raw;
        try {
          file = await compressImage(raw);
        } catch {
          file = raw;
        }

        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
          setUploadError(t("imageTooLarge").replace("{n}", String(MAX_SIZE_MB)));
          continue;
        }

        const ext = file.type === "image/jpeg" ? "jpg" : file.name.split(".").pop() || "jpg";
        const path = `users/${user.id}/${Date.now()}-${i}.${ext}`;

        const { error } = await supabase.storage.from("car-images").upload(path, file, {
          upsert: true,
          contentType: file.type || "image/jpeg",
        });
        if (error) {
          setUploadError(t("actionFailedRetry"));
          break;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("car-images").getPublicUrl(path);
        toAdd.push(publicUrl);
      }

      if (toAdd.length) onChange([...value, ...toAdd].slice(0, MAX_IMAGES));
      setUploading(false);
      setUploadProgress(null);
    },
    [value, onChange, disabled, t]
  );

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length) await uploadFiles(e.target.files);
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

  function setAsCover(idx: number) {
    if (idx <= 0) return;
    const arr = [...value];
    const [picked] = arr.splice(idx, 1);
    onChange([picked, ...arr]);
  }

  function handleAddUrl() {
    const url = pasteUrl.trim();
    if (!url || value.length >= MAX_IMAGES) return;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      setUploadError(t("enterValidImageUrl"));
      return;
    }
    onChange([...value, url].slice(0, MAX_IMAGES));
    setPasteUrl("");
    setUploadError("");
  }

  const countHint = t("imageCountHint")
    .replace("{count}", String(value.length))
    .replace("{max}", String(MAX_IMAGES))
    .replace("{n}", String(MAX_SIZE_MB));

  const progressLabel = uploadProgress
    ? t("uploadingProgress")
        .replace("{current}", String(uploadProgress.current))
        .replace("{total}", String(uploadProgress.total))
    : t("uploading");

  const canAdd = !disabled && !uploading && value.length < MAX_IMAGES;

  return (
    <div className="space-y-3">
      <p className="text-[11px] leading-relaxed text-[var(--muted-foreground)]">{t("photoTipCover")}</p>

      <div
        onDragEnter={(e) => {
          e.preventDefault();
          if (canAdd) setDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (canAdd) setDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (canAdd && e.dataTransfer.files?.length) void uploadFiles(e.dataTransfer.files);
        }}
        className={`rounded-[var(--radius)] border border-dashed p-4 transition ${
          dragging
            ? "border-[var(--accent)] bg-[var(--accent-muted)]"
            : "border-[var(--border)] bg-[var(--card)]"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <p className="text-[12px] font-medium text-[var(--foreground)]">{t("dropPhotosHere")}</p>
            <p className="mt-0.5 text-[10px] text-[var(--muted-foreground)]">{countHint}</p>
          </div>
          <button
            type="button"
            disabled={!canAdd}
            onClick={() => inputRef.current?.click()}
            className="btn-secondary min-h-11 shrink-0 px-4 text-[12px] disabled:opacity-50"
          >
            {uploading ? progressLabel : t("uploadImages")}
          </button>
        </div>

        {uploading && uploadProgress && (
          <div className="mt-3" role="status" aria-live="polite">
            <div className="mb-1 flex justify-between text-[10px] text-[var(--muted-foreground)]">
              <span>{progressLabel}</span>
              <span>
                {uploadProgress.current}/{uploadProgress.total}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[var(--border)]">
              <div
                className="h-full rounded-full bg-[var(--accent)] transition-all duration-300"
                style={{ width: `${Math.round((uploadProgress.current / uploadProgress.total) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {uploadError && (
        <p className="text-[11px] text-red-500" role="alert">
          {uploadError}
        </p>
      )}

      {value.length > 0 && (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {value.map((url, idx) => (
            <li key={`${url}-${idx}`} className="relative overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="aspect-[4/3] w-full object-cover" />
              {idx === 0 && (
                <span className="absolute left-1.5 top-1.5 rounded-sm bg-[var(--accent)] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-black">
                  {t("main")}
                </span>
              )}
              <div className="flex items-center justify-between gap-0.5 border-t border-[var(--border)] bg-[var(--card)] p-1">
                <div className="flex gap-0.5">
                  <button
                    type="button"
                    disabled={disabled || uploading || idx === 0}
                    onClick={() => moveImage(idx, -1)}
                    className="flex h-9 w-9 items-center justify-center rounded text-[12px] text-[var(--foreground)] hover:bg-[var(--border)] disabled:opacity-40"
                    title={t("moveLeft")}
                    aria-label={t("moveLeft")}
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    disabled={disabled || uploading || idx === value.length - 1}
                    onClick={() => moveImage(idx, 1)}
                    className="flex h-9 w-9 items-center justify-center rounded text-[12px] text-[var(--foreground)] hover:bg-[var(--border)] disabled:opacity-40"
                    title={t("moveRight")}
                    aria-label={t("moveRight")}
                  >
                    →
                  </button>
                </div>
                {idx > 0 && (
                  <button
                    type="button"
                    disabled={disabled || uploading}
                    onClick={() => setAsCover(idx)}
                    className="rounded px-1.5 py-1 text-[9px] font-medium text-[var(--accent)] hover:bg-[var(--accent-muted)] disabled:opacity-40"
                  >
                    {t("setAsCover")}
                  </button>
                )}
                <button
                  type="button"
                  disabled={disabled || uploading}
                  onClick={() => handleRemove(idx)}
                  className="flex h-9 w-9 items-center justify-center rounded text-[14px] text-red-400 hover:bg-red-500/20 disabled:opacity-50"
                  aria-label={t("remove")}
                >
                  ×
                </button>
              </div>
            </li>
          ))}
          {uploading && value.length < MAX_IMAGES && (
            <li
              className="aspect-[4/3] animate-pulse rounded-[var(--radius)] border border-[var(--border)] bg-[var(--border)]"
              aria-hidden
            />
          )}
        </ul>
      )}

      <details className="group">
        <summary className="cursor-pointer text-[10px] font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
          {t("advancedImageUrl")}
        </summary>
        <div className="mt-2 flex gap-2">
          <input
            type="url"
            value={pasteUrl}
            onChange={(e) => setPasteUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddUrl())}
            placeholder={t("pasteImageUrl")}
            disabled={disabled || value.length >= MAX_IMAGES}
            className="input-premium flex-1 text-[11px]"
          />
          <button
            type="button"
            disabled={disabled || !pasteUrl.trim() || value.length >= MAX_IMAGES}
            onClick={handleAddUrl}
            className="btn-secondary min-h-11 px-3 text-[11px] disabled:opacity-50"
          >
            {t("addUrl")}
          </button>
        </div>
      </details>
    </div>
  );
}
