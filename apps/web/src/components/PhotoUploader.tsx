'use client';

import { useRef, useState } from 'react';
import { api } from '@/lib/api';

export function PhotoUploader({
  label,
  hint,
  token,
  slot,
  valueKey,
  valueUrl,
  onUploaded,
  required,
}: {
  label: string;
  hint: string;
  token: string;
  slot: string;
  valueKey?: string | null;
  valueUrl?: string | null;
  onUploaded: (key: string, url: string) => void;
  required?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(valueUrl ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState<{ key: string; url: string; local: string } | null>(
    null,
  );

  async function onFile(file: File) {
    setError(null);
    setBusy(true);
    try {
      const local = URL.createObjectURL(file);
      const form = new FormData();
      form.append('file', file);
      const { data } = await api.post<{ key: string; url: string }>(
        `/uploads/photo?token=${encodeURIComponent(token)}&slot=${slot}`,
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      setPending({ key: data.key, url: data.url, local });
      setPreview(local);
      setConfirming(true);
    } catch {
      setError('Não foi possível enviar. Use JPG ou PNG até 8 MB.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <label className="text-sm font-medium text-mist">
          {label}
          {required ? <span className="text-copper"> *</span> : null}
        </label>
        <span className="text-xs text-mist-dim">{hint}</span>
      </div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="relative flex aspect-[4/5] w-full items-center justify-center overflow-hidden rounded-sm border border-dashed border-white/20 bg-ink-soft text-sm text-mist-dim"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <span className="px-4 text-center">
            Toque para enviar
            <br />
            <span className="text-xs opacity-70">rosto bem visível, luz natural</span>
          </span>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void onFile(f);
        }}
      />
      {busy ? <p className="text-xs text-foam">Enviando…</p> : null}
      {error ? <p className="text-xs text-[var(--danger)]">{error}</p> : null}
      {confirming && pending ? (
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-md bg-champagne px-3 py-2 text-xs font-semibold text-ink"
            onClick={() => {
              onUploaded(pending.key, pending.url);
              setConfirming(false);
              setPending(null);
            }}
          >
            Confirmar foto
          </button>
          <button
            type="button"
            className="rounded-md border border-white/20 px-3 py-2 text-xs text-mist"
            onClick={() => {
              setConfirming(false);
              setPending(null);
              setPreview(valueUrl ?? null);
              inputRef.current?.click();
            }}
          >
            Trocar
          </button>
        </div>
      ) : valueKey ? (
        <p className="text-xs text-foam">Foto confirmada</p>
      ) : null}
    </div>
  );
}
