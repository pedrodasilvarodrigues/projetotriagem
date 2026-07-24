"use client";

import { useState } from "react";
import { servicePostPublicUrl } from "@/lib/marketplace/explore";

export function ServicePostGallery({ images, providerName }: { images: string[]; providerName: string }) {
  const [activeImage, setActiveImage] = useState(0);

  return (
    <div>
      <div className="overflow-hidden rounded-[28px] bg-[#E8EFF5] shadow-[0_20px_55px_rgba(15,45,78,0.12)]">
        <img
          src={servicePostPublicUrl(images[activeImage])}
          alt={`Trabalho de ${providerName}, imagem ${activeImage + 1}`}
          className="aspect-[4/3] w-full object-cover sm:aspect-[16/11]"
        />
      </div>
      {images.length > 1 ? (
        <div className="mt-3 flex snap-x gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {images.map((image, index) => (
            <button
              type="button"
              key={image}
              onClick={() => setActiveImage(index)}
              aria-label={`Exibir imagem ${index + 1}`}
              aria-pressed={activeImage === index}
              className={`w-20 shrink-0 snap-start overflow-hidden rounded-xl border-2 transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F2811D]/25 ${activeImage === index ? "border-[#F2811D]" : "border-transparent opacity-75 hover:opacity-100"}`}
            >
              <img src={servicePostPublicUrl(image)} alt="" className="aspect-square w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
