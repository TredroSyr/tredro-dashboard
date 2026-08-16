import * as React from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import {
  buildCountryData,
  defaultCountries,
  parseCountry,
  usePhoneInput,
  type CountryIso2,
} from "react-international-phone";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import {
  phoneFormatOverrides,
  stripNationalLeadingZero,
} from "@/schema/phone-schema";
import { getCountryNameAr } from "@/lib/country-names";
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
}

const countries = defaultCountries
  .map((data) => {
    const parsed = parseCountry(data);
    const override = phoneFormatOverrides[parsed.iso2];
    return override ? buildCountryData({ ...parsed, format: override }) : data;
  })
  .filter((data) => parseCountry(data).iso2 === "sy");

const EXAMPLE_DIGITS = "912345678";

function buildFormattedExample(format: unknown): string | undefined {
  if (typeof format !== "string") return undefined;
  let i = 0;
  return format.replace(
    /\./g,
    () => EXAMPLE_DIGITS[i++ % EXAMPLE_DIGITS.length],
  );
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
    },
    forwardedRef,
  ) {
    const { inputValue, country, handlePhoneValueChange, inputRef } =
      usePhoneInput({
        defaultCountry: "sy",
        value: value ?? "",
        countries,
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
        "944 123 456" ??
        buildFormattedExample(country.format) ??
        placeholder ??
        "أدخل رقم الهاتف"
      );
    }, [country, placeholder]);

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
          onChange={handlePhoneValueChange}
          onBlur={onBlur}
          className="h-full flex-1 rounded-none border-0 bg-transparent text-left tabular-nums shadow-none focus-visible:ring-0"
        />
      </div>
    );
  },
);
