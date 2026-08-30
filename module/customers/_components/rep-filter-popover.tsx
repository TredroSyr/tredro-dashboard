"use client";
import * as React from "react";
import { Users, ChevronDown } from "lucide-react";
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
import { useRepsQuery } from "@/module/reps/hooks";

interface RepFilterPopoverProps {
  value: string[];
  onChange: (value: string[]) => void;
}

export function RepFilterPopover({
  value,
  onChange,
}: RepFilterPopoverProps) {
  const { data: repsRes, isLoading } = useRepsQuery();
  const reps = repsRes?.data?.reps ?? [];

  const toggle = (id: string) => {
    if (value.includes(id)) onChange(value.filter((v) => v !== id));
    else onChange([...value, id]);
  };

  return (
    <Popover>
      <PopoverTrigger>
        <Button type="button" variant="outline" size="sm" className="gap-1.5">
          <Users className="size-4" />
          المندوبون
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
          <CommandInput placeholder="ابحث عن مندوب..." />
          <CommandList>
            {isLoading ? (
              <div className="py-6 text-center text-sm font-normal text-muted-foreground">
                جارِ التحميل...
              </div>
            ) : (
              <>
                <CommandEmpty>لا توجد مندوبون</CommandEmpty>
                <CommandGroup>
                  {reps.map((rep) => (
                    <CommandItem
                      key={rep.id}
                      value={`${rep.name} ${rep.id}`}
                      onSelect={() => toggle(String(rep.id))}
                      className="gap-2"
                    >
                      <Checkbox checked={value.includes(String(rep.id))} />
                      <div className="flex flex-col">
                        <span className="text-sm font-normal">
                          {rep.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {rep.phone}
                        </span>
                      </div>
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
