"use client";

import { useState } from "react";

function maskDate(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function toIsoDate(value: string) {
  const [dayText, monthText, yearText] = value.split("/");
  if (!dayText || !monthText || !yearText || yearText.length !== 4) return "";

  const day = Number(dayText);
  const month = Number(monthText);
  const year = Number(yearText);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return "";
  return `${yearText}-${monthText}-${dayText}`;
}

function toDisplayDate(value?: string | null) {
  if (!value) return "";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : maskDate(value);
}

export function DateTextInput({
  name,
  className,
  initialValue,
  required = false,
  autoComplete,
  placeholder = "dd/mm/aaaa"
}: {
  name: string;
  className: string;
  initialValue?: string | null;
  required?: boolean;
  autoComplete?: string;
  placeholder?: string;
}) {
  const [displayValue, setDisplayValue] = useState(() => toDisplayDate(initialValue));
  const isoValue = toIsoDate(displayValue);

  return (
    <>
      <input
        required={required}
        type="text"
        inputMode="numeric"
        autoComplete={autoComplete}
        placeholder={placeholder}
        maxLength={10}
        pattern="\d{2}/\d{2}/\d{4}"
        value={displayValue}
        onChange={(event) => setDisplayValue(maskDate(event.target.value))}
        onBlur={(event) => {
          if (displayValue && (displayValue.length !== 10 || !isoValue)) event.currentTarget.setCustomValidity("Informe uma data valida no formato dd/mm/aaaa.");
        }}
        onInvalid={(event) => event.currentTarget.setCustomValidity("Informe uma data valida no formato dd/mm/aaaa.")}
        onInput={(event) => event.currentTarget.setCustomValidity("")}
        className={className}
      />
      <input name={name} type="hidden" value={isoValue} />
    </>
  );
}
