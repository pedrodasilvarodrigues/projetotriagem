"use client";

import { useState, useTransition } from "react";
import { Heart, LoaderCircle } from "lucide-react";
import { toggleProfessionalLikeAction } from "@/lib/actions/workspace";

type Props = {
  professionalId: string;
  demandId: string | null;
  initialLikeId: string | null;
  initialStatus: "pendente" | "processado" | null;
};

export function ProfessionalLikeButton({ professionalId, demandId, initialLikeId, initialStatus }: Props) {
  const [likeId, setLikeId] = useState(initialLikeId);
  const [status, setStatus] = useState(initialStatus);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isLiked = Boolean(likeId);
  const isProcessed = status === "processado";

  function toggleLike() {
    if (!demandId || isProcessed || isPending) return;
    const previous = { likeId, status };
    setMessage(null);
    setLikeId(isLiked ? null : "optimistic");
    setStatus(isLiked ? null : "pendente");

    startTransition(async () => {
      const result = await toggleProfessionalLikeAction({
        professionalId,
        demandId,
        likeId: previous.likeId
      });

      if (!result.ok) {
        setLikeId(previous.likeId);
        setStatus(previous.status);
        setMessage(result.error);
        return;
      }

      setLikeId(result.likeId);
      setStatus(result.status);
      setMessage(result.message);
    });
  }

  return (
    <div className="grid gap-2">
      <button
        type="button"
        onClick={toggleLike}
        disabled={!demandId || isProcessed || isPending}
        aria-pressed={isLiked}
        className={[
          "talent-like-button",
          isLiked ? "is-liked" : "",
          !demandId ? "is-disabled" : ""
        ].join(" ")}
      >
        {isPending ? (
          <LoaderCircle aria-hidden="true" className="animate-spin" size={18} />
        ) : (
          <Heart aria-hidden="true" fill={isLiked ? "currentColor" : "none"} size={18} />
        )}
        <span>
          {!demandId
            ? "Escolha uma demanda"
            : isProcessed
              ? "Apresentação formalizada"
              : isLiked
                ? "Desfazer interesse"
                : "Demonstrar interesse"}
        </span>
      </button>
      {message ? <p className="text-xs font-semibold text-[#38506F]" role="status">{message}</p> : null}
    </div>
  );
}
