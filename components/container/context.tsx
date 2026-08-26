"use client";

import * as React from "react";
import type { UseFormReturn, FieldValues } from "react-hook-form";
import type { ContainerContextValue } from "./types";

export const ContainerContext =
  React.createContext<ContainerContextValue | null>(null);

export const ContainerFormContext =
  React.createContext<UseFormReturn<FieldValues> | null>(null);

export const MultiStepContentWidthContext = React.createContext<
  string | number | undefined
>(undefined);

export function useContainerContext() {
  const context = React.useContext(ContainerContext);
  if (!context) {
    throw new Error("Container subcomponents must be used within Container");
  }
  return context;
}

export function useContainerFormContext() {
  return React.useContext(ContainerFormContext);
}

export function useMultiStepContentWidth() {
  return React.useContext(MultiStepContentWidthContext);
}
