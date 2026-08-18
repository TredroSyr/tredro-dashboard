import * as React from "react";
import { Check, Copy, Phone } from "lucide-react";
import {
  buildCountryData,
  defaultCountries,
  parseCountry,
  usePhoneInput,
} from "react-international-phone";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  phoneFormatOverrides,
  stripNationalLeadingZero,
} from "@/schema/phone-schema";
import { CountryFlag } from "./country-flag";

export interface PhoneInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  error?: boolean;
  placeholder?: string;
  name?: string;
  id?: string;
  className?: string;
  readOnly?: boolean;
}

const editCountries = defaultCountries
  .map((data) => {
    const parsed = parseCountry(data);
    const override = phoneFormatOverrides[parsed.iso2];
    return override ? buildCountryData({ ...parsed, format: override }) : data;
  })
  .filter((data) => parseCountry(data).iso2 === "sy");

const viewCountries = defaultCountries.map((data) => {
  const parsed = parseCountry(data);
  const override = phoneFormatOverrides[parsed.iso2];
  return override ? buildCountryData({ ...parsed, format: override }) : data;
});

const EXAMPLE_DIGITS = "912345678";

function buildFormattedExample(format: unknown): string | undefined {
  if (typeof format !== "string") return undefined;
  let i = 0;
  return format.replace(
    /\./g,
    () => EXAMPLE_DIGITS[i++ % EXAMPLE_DIGITS.length],
  );
}

// بيكشف إذا الجهاز موبايل/تابلت (بيدعم الاتصال المباشر)
function isMobileDevice() {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  function PhoneInput(
    {
      value,
      onChange,
      onBlur,
      disabled,
      error,
      placeholder,
      name,
      id,
      className,
      readOnly = false,
    },
    forwardedRef,
  ) {
    const { inputValue, country, handlePhoneValueChange, inputRef } =
      usePhoneInput({
        defaultCountry: "sy",
        value: value ?? "",
        countries: readOnly ? viewCountries : editCountries,
        disableDialCodeAndPrefix: true,
        onChange: (data) =>
          onChange?.(
            stripNationalLeadingZero(data.phone, data.country.dialCode),
          ),
      });

    React.useImperativeHandle(forwardedRef, () => inputRef.current!, [
      inputRef,
    ]);

    const dynamicPlaceholder = React.useMemo(() => {
      return (
        buildFormattedExample(country.format) ??
        placeholder ??
        "أدخل رقم الهاتف"
      );
    }, [country, placeholder]);

    const handleChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const dialCode = country.dialCode;
        let raw = e.target.value;
        const cleaned = raw.replace(/[\s()-]/g, "");

        if (cleaned.startsWith(`+${dialCode}`)) {
          raw = cleaned.slice(dialCode.length + 1);
        } else if (cleaned.startsWith(`00${dialCode}`)) {
          raw = cleaned.slice(dialCode.length + 2);
        } else if (cleaned.startsWith(dialCode) && cleaned.length > 9) {
          raw = cleaned.slice(dialCode.length);
        }

        handlePhoneValueChange({
          ...e,
          target: { ...e.target, value: raw },
        } as React.ChangeEvent<HTMLInputElement>);
      },
      [country.dialCode, handlePhoneValueChange],
    );

    const [copied, setCopied] = React.useState(false);
    const fullNumber = `+${country.dialCode}${inputValue}`;

    const handleAction = React.useCallback(async () => {
      if (isMobileDevice()) {
        window.location.href = `tel:${fullNumber}`;
        return;
      }
      try {
        await navigator.clipboard.writeText(fullNumber);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch {
        // فشل النسخ (متصفح قديم / بدون صلاحية) — تجاهل بصمت
      }
    }, [fullNumber]);

    if (readOnly) {
      return (
        <div
          dir="ltr"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border border-input bg-muted/30 px-2.5 py-1 text-sm w-fit",
            className,
          )}
        >
          <CountryFlag iso2={country.iso2} className="h-3.5 w-5 shrink-0" />
          <span dir="ltr" className="text-sm tabular-nums">
            +{country.dialCode}
          </span>
          <span className="tabular-nums">{inputValue || "—"}</span>

          <button
            type="button"
            onClick={handleAction}
            title={isMobileDevice() ? "اتصال" : "نسخ الرقم"}
            className="ms-1 flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5" />
            ) : isMobileDevice() ? (
              <Phone className="h-3.5 w-3.5" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      );
    }

    return (
      <div
        dir="ltr"
        className={cn(
          "flex h-12 w-full items-stretch overflow-hidden rounded-xl border border-input shadow-sm transition-colors",
          "focus-within:outline-none focus-within:ring-1 focus-within:ring-primary",
          error && "border-destructive focus-within:ring-destructive",
          disabled && "cursor-not-allowed opacity-50 pointer-events-none",
          className,
        )}
      >
        <div className="flex h-full shrink-0 items-center gap-1.5 border-e border-input px-3 text-muted-foreground">
          <CountryFlag iso2={country.iso2} className="h-4 w-6" />
          <span dir="ltr" className="text-sm tabular-nums">
            +{country.dialCode}
          </span>
        </div>

        <Input
          ref={inputRef}
          id={id}
          name={name}
          type="tel"
          dir="ltr"
          inputMode="tel"
          autoComplete="tel"
          disabled={disabled}
          placeholder={dynamicPlaceholder}
          value={inputValue}
          onChange={handleChange}
          onBlur={onBlur}
          className="h-full flex-1 rounded-none border-0 bg-transparent text-left tabular-nums shadow-none focus-visible:ring-0"
        />
      </div>
    );
  },
);
