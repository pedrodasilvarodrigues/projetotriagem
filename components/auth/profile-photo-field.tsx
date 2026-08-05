"use client";

import { Camera, UserRound } from "lucide-react";
import { useEffect, useId, useState } from "react";

export function ProfilePhotoField({ required = true }: { required?: boolean }) {
  const inputId = useId();
  const helpId = useId();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <section className="relative overflow-hidden rounded-2xl border border-[#0F2D4E]/15 bg-[#F7F9FC] p-4 sm:p-5">
      <span className="absolute inset-y-0 left-0 w-1 bg-[#F2811D]" aria-hidden="true" />
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
        <div className="relative grid size-24 shrink-0 place-items-center overflow-hidden rounded-full border-4 border-[#FCFDFE] bg-[#DDE7F0] text-[#0F2D4E] shadow-[0_0_0_2px_rgba(15,45,78,.16),0_12px_28px_rgba(15,45,78,.14)]">
          {previewUrl ? (
            <img src={previewUrl} alt="Pré-visualização da foto profissional" className="size-full object-cover" />
          ) : (
            <UserRound aria-hidden="true" size={38} strokeWidth={1.7} />
          )}
          <span className="absolute bottom-0 right-0 grid size-7 place-items-center rounded-full bg-[#F2811D] text-[#071522] ring-2 ring-[#FCFDFE]" aria-hidden="true">
            <Camera size={14} />
          </span>
        </div>

        <div className="min-w-0 flex-1 text-center sm:text-left">
          <h2 className="font-display text-base font-bold text-[#0F2D4E]">Sua foto profissional</h2>
          <p id={helpId} className="mt-1 text-sm leading-6 text-slate-600">
            Use uma foto nítida, de frente e com boa iluminação. Ela ajuda a Empresa a reconhecer quem está avaliando.
          </p>
          <label
            htmlFor={inputId}
            className="mt-3 inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#0F2D4E] px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(15,45,78,.16)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#173D65] focus-within:outline-none focus-within:ring-2 focus-within:ring-[#F2811D] focus-within:ring-offset-2 active:translate-y-0"
          >
            <Camera aria-hidden="true" size={17} />
            {previewUrl ? "Trocar foto" : "Escolher foto"}
            <input
              id={inputId}
              name="avatar"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              required={required}
              aria-describedby={helpId}
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                setPreviewUrl((current) => {
                  if (current) URL.revokeObjectURL(current);
                  return file ? URL.createObjectURL(file) : null;
                });
              }}
            />
          </label>
          <span className="ml-0 mt-2 block text-xs text-slate-500 sm:ml-3 sm:inline">JPG, PNG ou WEBP, até 2 MB.</span>
        </div>
      </div>
    </section>
  );
}
