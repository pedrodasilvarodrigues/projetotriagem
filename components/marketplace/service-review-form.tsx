"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { useFormStatus } from "react-dom";
import { createServiceReviewAction } from "@/lib/actions/marketplace";

const ratingLabels = ["Muito ruim", "Ruim", "Regular", "Muito bom", "Excelente"];

function SubmitReviewButton({ rating }: { rating: number }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || rating === 0}
      className="mt-3 w-full rounded-xl bg-[#0F2D4E] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#173f6b] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Publicando..." : "Publicar avaliação"}
    </button>
  );
}

export function ServiceReviewForm({ conversationId }: { conversationId: string }) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const visibleRating = hoveredRating || rating;

  return (
    <form action={createServiceReviewAction} className="mt-4">
      <input type="hidden" name="conversationId" value={conversationId} />
      <input type="hidden" name="rating" value={rating || ""} />

      <fieldset>
        <legend className="text-sm font-bold text-[#0F2D4E]">Sua nota</legend>
        <div
          className="mt-2 flex gap-1"
          role="radiogroup"
          aria-label="Nota do prestador, de uma a cinco estrelas"
          onMouseLeave={() => setHoveredRating(0)}
        >
          {ratingLabels.map((label, index) => {
            const value = index + 1;
            const selected = value <= visibleRating;

            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={rating === value}
                aria-label={`${value} ${value === 1 ? "estrela" : "estrelas"} — ${label}`}
                onClick={() => setRating(value)}
                onMouseEnter={() => setHoveredRating(value)}
                onFocus={() => setHoveredRating(value)}
                onBlur={() => setHoveredRating(0)}
                className="rounded-lg p-1.5 text-slate-300 transition hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2811D] focus-visible:ring-offset-2"
              >
                <Star
                  aria-hidden="true"
                  size={30}
                  className={selected ? "text-[#F2811D]" : "text-slate-300"}
                  fill={selected ? "currentColor" : "none"}
                />
              </button>
            );
          })}
        </div>
        <p className="mt-1 min-h-5 text-xs font-medium text-slate-500">
          {visibleRating ? `${visibleRating}/5 — ${ratingLabels[visibleRating - 1]}` : "Selecione de 1 a 5 estrelas"}
        </p>
      </fieldset>

      <label className="mt-3 block text-sm font-semibold text-[#0F2D4E]">
        Comentário <span className="font-normal text-slate-500">(opcional)</span>
        <textarea
          name="comment"
          maxLength={2000}
          rows={4}
          className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-[#F2811D] focus:ring-4 focus:ring-orange-100"
          placeholder="Conte como foi sua experiência"
        />
      </label>

      <SubmitReviewButton rating={rating} />
    </form>
  );
}
