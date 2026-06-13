"use client";

import { useEffect } from "react";
import { type AppLanguage, phraseMaps } from "@/lib/i18n/ui";

const originalTextByNode = new WeakMap<Text, string>();

function translateTextNodes(root: HTMLElement, language: AppLanguage) {
  const dictionary = language === "pt-BR" ? null : phraseMaps[language];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const updates: Array<{ node: Text; text: string }> = [];

  while (walker.nextNode()) {
    const current = walker.currentNode as Text;
    const currentValue = current.textContent ?? "";
    const originalValue = originalTextByNode.get(current) ?? currentValue;

    if (!originalTextByNode.has(current)) {
      originalTextByNode.set(current, originalValue);
    }

    const normalized = originalValue.trim();
    if (!normalized) continue;

    if (language === "pt-BR") {
      if (currentValue !== originalValue) {
        updates.push({ node: current, text: originalValue });
      }
      continue;
    }

    const translated = dictionary?.[normalized];
    if (translated) {
      updates.push({ node: current, text: originalValue.replace(normalized, translated) });
    }
  }

  updates.forEach(({ node, text }) => {
    node.textContent = text;
  });
}

export function LanguageRuntime({ preferredLanguage }: { preferredLanguage: AppLanguage }) {
  useEffect(() => {
    translateTextNodes(document.body, preferredLanguage);

    const observer = new MutationObserver(() => {
      translateTextNodes(document.body, preferredLanguage);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    return () => observer.disconnect();
  }, [preferredLanguage]);

  return null;
}
