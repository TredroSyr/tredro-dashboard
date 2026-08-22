"use client";
import * as React from "react";
import { Tag, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useCategoriesQuery } from "../hooks/categories";

interface CategoryFilterPopoverProps {
  value: string[];
  onChange: (value: string[]) => void;
}

export function CategoryFilterPopover({
  value,
  onChange,
}: CategoryFilterPopoverProps) {
  const { data: categoriesRes, isLoading } = useCategoriesQuery();
  const categories = categoriesRes?.data?.categories ?? [];

  const toggle = (id: string) => {
    if (value.includes(id)) onChange(value.filter((v) => v !== id));
    else onChange([...value, id]);
  };

  return (
    <Popover>
      <PopoverTrigger>
        <Button type="button" variant="outline" size="sm" className="gap-1.5">
          <Tag className="size-4" />
          التصنيف
          {value.length > 0 && (
            <Badge
              variant="secondary"
              className="rounded-full px-1.5 font-normal"
            >
              {value.length}
            </Badge>
          )}
          <ChevronDown className="size-3.5 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder="ابحث عن تصنيف..." />
          <CommandList>
            {isLoading ? (
              <div className="py-6 text-center text-sm font-normal text-muted-foreground">
                جارِ التحميل...
              </div>
            ) : (
              <>
                <CommandEmpty>لا توجد تصنيفات</CommandEmpty>
                <CommandGroup>
                  {categories.map((c) => (
                    <CommandItem
                      key={c.id}
                      value={c.name}
                      onSelect={() => toggle(String(c.id))}
                      className="gap-2"
                    >
                      <Checkbox checked={value.includes(String(c.id))} />
                      <span className="text-sm font-normal">
                        {c.name}
                        {c.is_global && (
                          <span className="text-muted-foreground">
                            {" "}
                            (افتراضي)
                          </span>
                        )}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
                {value.length > 0 && (
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => onChange([])}
                      className="justify-center text-center text-sm font-normal text-muted-foreground"
                    >
                      مسح الفلتر
                    </CommandItem>
                  </CommandGroup>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
