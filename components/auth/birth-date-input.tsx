"use client";

import { useState } from "react";

function maskBirthDate(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function toIsoBirthDate(value: string) {
  const [dayText, monthText, yearText] = value.split("/");
  if (!dayText || !monthText || !yearText || yearText.length !== 4) return "";

  const day = Number(dayText);
  const month = Number(monthText);
  const year = Number(yearText);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return "";
  return `${yearText}-${monthText}-${dayText}`;
}

function toDisplayBirthDate(value?: string | null) {
  if (!value) return "";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : maskBirthDate(value);
}

export function BirthDateInput({
  className,
  initialValue,
  required = true
}: {
  className: string;
  initialValue?: string | null;
  required?: boolean;
}) {
  const [displayValue, setDisplayValue] = useState(() => toDisplayBirthDate(initialValue));
  const isoValue = toIsoBirthDate(displayValue);

  return (
    <>
      <input
        required={required}
        type="text"
        inputMode="numeric"
        autoComplete="bday"
        placeholder="dd/mm/aaaa"
        maxLength={10}
        pattern="\d{2}/\d{2}/\d{4}"
        value={displayValue}
        onChange={(event) => setDisplayValue(maskBirthDate(event.target.value))}
        onBlur={(event) => {
          if (displayValue && (displayValue.length !== 10 || !isoValue)) event.currentTarget.setCustomValidity("Informe uma data valida no formato dd/mm/aaaa.");
        }}
        onInvalid={(event) => event.currentTarget.setCustomValidity("Informe uma data valida no formato dd/mm/aaaa.")}
        onInput={(event) => event.currentTarget.setCustomValidity("")}
        className={className}
      />
      <input name="birthDate" type="hidden" value={isoValue} />
    </>
  );
}
