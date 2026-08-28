"use client";

import { useCallback } from "react";
import { isAxiosError } from "axios";
import type { FieldValues, Path, UseFormReturn } from "react-hook-form";

/**
 * Shape returned by our backend for a failed request, e.g.:
 * { success: false, message: "بيانات غير صالحة", errors: { sku: ["..."] } }
 */
export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

const DEFAULT_ERROR_MESSAGE = "حدث خطأ، حاول مرة أخرى";

export function getApiErrorMessage(error: unknown): string {
  if (isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data?.message || DEFAULT_ERROR_MESSAGE;
  }
  if (error instanceof Error && error.message) return error.message;
  return DEFAULT_ERROR_MESSAGE;
}

export interface ApiFormErrorResult {
  /** Top-level message from the backend, meant for a banner/toast. */
  message: string;
  /** Names of form fields that received a server-side error. */
  fields: string[];
}

/**
 * Maps a failed mutation's error onto a react-hook-form instance:
 * field-level errors (error.response.data.errors) are attached via
 * form.setError so they render under the matching field, and the
 * top-level message is returned for a generic banner/toast.
 *
 * Only keys that exist on the form's current values are applied via
 * setError — anything else is dropped from `fields` but still folded
 * into the returned `message` by the caller if desired.
 */
export function useApiFormErrorHandler<TFieldValues extends FieldValues>(
  form: UseFormReturn<TFieldValues>,
) {
  return useCallback(
    (error: unknown): ApiFormErrorResult => {
      const message = getApiErrorMessage(error);
      const fields: string[] = [];

      if (isAxiosError<ApiErrorResponse>(error)) {
        const errors = error.response?.data?.errors;
        if (errors) {
          const values = form.getValues();
          Object.entries(errors).forEach(([field, messages]) => {
            const text = messages?.[0];
            if (!text || !(field in values)) return;
            form.setError(field as Path<TFieldValues>, {
              type: "server",
              message: text,
            });
            fields.push(field);
          });
        }
      }

      return { message, fields };
    },
    [form],
  );
}
