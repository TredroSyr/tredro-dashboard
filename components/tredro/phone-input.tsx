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
import { getCountryNameAr, preferredCountries } from "@/lib/country-names";
import { CountryFlag } from "./country-flag";

export interface PhoneInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  defaultCountry?: CountryIso2;
  disabled?: boolean;

  error?: boolean;
  placeholder?: string;
  name?: string;
  id?: string;
  className?: string;
}

const countries = defaultCountries.map((data) => {
  const parsed = parseCountry(data);
  const override = phoneFormatOverrides[parsed.iso2];
  return override ? buildCountryData({ ...parsed, format: override }) : data;
});

const countryList = countries.map(parseCountry);

const sortedCountries = [
  ...preferredCountries
    .map((iso2) => countryList.find((c) => c.iso2 === iso2))
    .filter((c): c is (typeof countryList)[number] => Boolean(c)),
  ...countryList
    .filter((c) => !preferredCountries.includes(c.iso2))
    .sort((a, b) =>
      getCountryNameAr(a.iso2, a.name).localeCompare(
        getCountryNameAr(b.iso2, b.name),
        "ar",
      ),
    ),
];

const phoneExamples: Partial<Record<CountryIso2, string>> = {
  sy: "944 123 456",
  sa: "50 123 4567",
  ae: "50 123 4567",
  eg: "100 123 4567",
  jo: "79 123 4567",
  lb: "71 123 456",
  iq: "790 123 4567",
  kw: "500 12345",
  qa: "3312 3456",
  bh: "3612 3456",
  om: "9212 3456",
  ye: "712 345 678",
  ps: "599 123 456",
  tr: "501 234 56 78",
  us: "201 555 0123",
  gb: "7400 123456",
};

const EXAMPLE_DIGITS = "912345678";

/** يبني مثال رقم اعتماداً على قناع تنسيق الدولة (format) عند غياب مثال جاهز */
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
      defaultCountry = "sy",
      disabled,
      error,
      placeholder,
      name,
      id,
      className,
    },
    forwardedRef,
  ) {
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState("");

    const {
      inputValue,
      country,
      setCountry,
      handlePhoneValueChange,
      inputRef,
    } = usePhoneInput({
      defaultCountry,
      value: value ?? "",
      countries,
      preferredCountries,
      disableDialCodeAndPrefix: true,
      onChange: (data) =>
        onChange?.(stripNationalLeadingZero(data.phone, data.country.dialCode)),
    });

    React.useImperativeHandle(forwardedRef, () => inputRef.current!, [
      inputRef,
    ]);

    const dynamicPlaceholder = React.useMemo(() => {
      return (
        phoneExamples[country.iso2] ??
        buildFormattedExample(country.format) ??
        placeholder ??
        "أدخل رقم الهاتف"
      );
    }, [country, placeholder]);

    const filtered = React.useMemo(() => {
      const q = search.trim().toLowerCase();
      if (!q) return sortedCountries;
      return sortedCountries.filter((c) => {
        const ar = getCountryNameAr(c.iso2, c.name);
        return (
          ar.includes(q) ||
          c.name.toLowerCase().includes(q) ||
          c.iso2.includes(q) ||
          c.dialCode.includes(q.replace("+", ""))
        );
      });
    }, [search]);

    return (
      <div
        dir="ltr"
        className={cn(
          "flex h-11 w-full items-stretch overflow-hidden rounded-lg border bg-background transition-colors",
          error
            ? "border-destructive ring-2 ring-inset ring-destructive/30"
            : "border-input focus-within:ring-2 focus-within:ring-ring/40",
          disabled && "pointer-events-none opacity-60",
          className,
        )}
      >
        <Popover
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            if (!next) setSearch("");
          }}
        >
          <PopoverTrigger>
            <Button
              type="button"
              variant="ghost"
              disabled={disabled}
              aria-label="اختيار الدولة"
              className="h-full shrink-0 gap-1.5 rounded-none border-e border-input px-3 hover:bg-accent focus-visible:ring-0"
            >
              <CountryFlag iso2={country.iso2} className="h-4 w-6" />
              <span
                dir="ltr"
                className="text-sm tabular-nums text-muted-foreground"
              >
                +{country.dialCode}
              </span>
              <ChevronDown className="size-3.5 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" dir="rtl" className="w-[19rem] p-0">
            <div className="flex items-center gap-2 border-b border-border px-3">
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث عن دولة أو كود..."
                className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <div className="max-h-72 overflow-y-auto py-1">
              {filtered.length === 0 && (
                <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                  لا توجد نتائج
                </p>
              )}
              {filtered.map((c) => (
                <button
                  key={c.iso2}
                  type="button"
                  onClick={() => {
                    setCountry(c.iso2);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 px-3 py-2 text-right text-sm transition-colors hover:bg-accent",
                    c.iso2 === country.iso2 && "bg-accent/60",
                  )}
                >
                  <CountryFlag iso2={c.iso2} className="h-4 w-6 shrink-0" />
                  <span className="flex-1 truncate text-foreground">
                    {getCountryNameAr(c.iso2, c.name)}
                  </span>
                  <span
                    dir="ltr"
                    className="tabular-nums text-muted-foreground"
                  >
                    +{c.dialCode}
                  </span>
                  {c.iso2 === country.iso2 && (
                    <Check className="size-4 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

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
