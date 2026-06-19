"use client";

import { useEffect, useId, useRef, useState } from "react";

type InstitutionOption = {
  id: string;
  name: string;
  status: string;
};

export function InstitutionAutocomplete({
  name = "institution",
  label = "Instituição",
  required = false,
  className = "field-input mt-2",
  labelClassName = "text-sm font-semibold",
  initialValue = ""
}: {
  name?: string;
  label?: string;
  required?: boolean;
  className?: string;
  labelClassName?: string;
  initialValue?: string | null;
}) {
  const listId = useId();
  const [value, setValue] = useState(initialValue ?? "");
  const [options, setOptions] = useState<InstitutionOption[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [message, setMessage] = useState("");
  const wrapperRef = useRef<HTMLLabelElement>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    const query = value.trim();
    setMessage("");
    if (query.length < 2) {
      setOptions([]);
      setIsOpen(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      const response = await fetch(`/api/institutions?q=${encodeURIComponent(query)}`, { signal: controller.signal });
      if (!response.ok) return;
      const payload = await response.json();
      setOptions(payload.institutions ?? []);
      setIsOpen(true);
      setActiveIndex(-1);
    }, 180);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [value]);

  const selectOption = (option: InstitutionOption) => {
    setValue(option.name);
    setIsOpen(false);
    setIsAdding(false);
    setMessage("");
  };

  const saveInstitution = async () => {
    const finalName = newName.trim() || value.trim();
    if (finalName.length < 2) {
      setMessage("Informe o nome da instituição.");
      return;
    }

    const response = await fetch("/api/institutions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: finalName })
    });
    const payload = await response.json();

    if (response.status === 409 && payload.institution) {
      setMessage(payload.message ?? `Você quis dizer: ${payload.institution.name}`);
      setOptions([payload.institution]);
      setIsOpen(true);
      return;
    }

    if (!response.ok || !payload.institution) {
      setMessage("Não foi possível salvar a instituição.");
      return;
    }

    setValue(payload.institution.name);
    setNewName("");
    setIsAdding(false);
    setIsOpen(false);
    setMessage("Instituição salva como pendente.");
  };

  return (
    <label ref={wrapperRef} className={`relative block ${labelClassName}`}>
      {label}
      <input
        required={required}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onFocus={() => {
          if (value.trim().length >= 2) setIsOpen(true);
        }}
        onKeyDown={(event) => {
          if (!isOpen || options.length === 0) return;
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setActiveIndex((current) => Math.min(current + 1, options.length - 1));
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((current) => Math.max(current - 1, 0));
          }
          if (event.key === "Enter" && activeIndex >= 0) {
            event.preventDefault();
            selectOption(options[activeIndex]);
          }
          if (event.key === "Escape") setIsOpen(false);
        }}
        className={className}
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={listId}
        aria-autocomplete="list"
        placeholder="Digite para buscar"
      />
      <input type="hidden" name={name} value={value} />
      {isOpen ? (
        <div className="absolute z-30 mt-1 w-full rounded-md border border-slate-200 bg-white p-2 text-sm shadow-xl">
          {options.length > 0 ? (
            <ul id={listId} role="listbox" className="max-h-56 overflow-y-auto">
              {options.map((option, index) => (
                <li key={option.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={activeIndex === index}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectOption(option)}
                    className={`flex w-full items-center justify-between rounded px-3 py-2 text-left hover:bg-blue-50 ${activeIndex === index ? "bg-blue-50" : ""}`}
                  >
                    <span>{option.name}</span>
                    <span className="text-xs text-slate-500">{option.status === "pending" ? "pendente" : "ativa"}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="space-y-2 p-2">
              <p className="text-slate-600">Não encontrou sua instituição?</p>
              <button type="button" onClick={() => { setIsAdding(true); setNewName(value); }} className="rounded bg-slate-950 px-3 py-2 text-xs font-semibold text-white">
                + Adicionar Instituição
              </button>
            </div>
          )}
        </div>
      ) : null}
      {isAdding ? (
        <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3">
          <span className="text-sm font-semibold">Nome da Instituição</span>
          <input value={newName} onChange={(event) => setNewName(event.target.value)} className="field-input mt-2" />
          <button type="button" onClick={saveInstitution} className="mt-3 rounded bg-blue-700 px-3 py-2 text-xs font-semibold text-white">
            Salvar Instituição
          </button>
        </div>
      ) : null}
      {message ? <p className="mt-2 text-xs font-semibold text-blue-700">{message}</p> : null}
    </label>
  );
}
