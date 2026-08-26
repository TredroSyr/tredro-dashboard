"use client";

import { IconRenderer } from "@/assets/icons/iconRenderer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckIcon, Loader2 } from "lucide-react";
import * as React from "react";
import { useFormContext, useWatch } from "react-hook-form";
import {
  MultiStepContentWidthContext,
  useMultiStepContentWidth,
} from "./context";
import type { MultiStepProps } from "./types";
import { Actions } from "./Actions";
import { Title } from "./Title";
import { Content } from "./Content";
import { ToggleFormLangSlot } from "./ToggleFormLang";

function MultiStepContentSlot({
  title,
  description,
  children,
  className,
  contentClassName,
  titleDescriptionClassName,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  titleDescriptionClassName?: string;
}) {
  const contentWidth = useMultiStepContentWidth();

  // Use contentClassName if provided, otherwise fall back to contentWidth style
  const widthClasses = contentClassName || "";
  const widthStyle =
    !contentClassName && contentWidth
      ? {
          width:
            typeof contentWidth === "number"
              ? `${contentWidth}px`
              : contentWidth,
        }
      : undefined;

  return (
    <Content className={cn(className, "overflow-y-auto")}>
      <div
        className={cn(
          "flex flex-col items-center  gap-6 mx-auto",
          widthClasses,
        )}
        style={widthStyle}
      >
        {(title || description) && (
          <div
            className={cn(
              "flex flex-col gap-1 items-center text-center pb-4",
              titleDescriptionClassName,
            )}
          >
            {title && (
              <h2 className="text-primary text-lg font-semibold">{title}</h2>
            )}
            {description && (
              <p className="text-utility-gray-400 text-sm font-normal">
                {description}
              </p>
            )}
          </div>
        )}
        {children}
      </div>
    </Content>
  );
}

export function MultiStep({
  steps,
  title,
  className,
  contentWidth,
  contentClassName,
  titleDescriptionClassName,
  onNext,
  onPrevious,
  onCancel,
  onSkip,
  onSubmit,
  onValidate,
  showActions = true,
  customSubmitAction,
  buttonConfig,
}: MultiStepProps) {
  const form = useFormContext();
  const currentStepIndex = form.watch("currentStepIndex") ?? 0;

  // Filter out hidden steps and create a mapping
  const visibleSteps = React.useMemo(() => {
    return steps
      .map((step, index) => ({ step, originalIndex: index }))
      .filter(({ step }) => {
        if (step.hidden) {
          return !step.hidden(form);
        }
        return true;
      });
  }, [steps, form]);

  // Find the current visible step index
  const currentVisibleStepIndex = React.useMemo(() => {
    const found = visibleSteps.findIndex(
      ({ originalIndex }) => originalIndex === currentStepIndex,
    );
    return found >= 0 ? found : 0;
  }, [visibleSteps, currentStepIndex]);

  // If current step is hidden, move to the first visible step
  React.useEffect(() => {
    const currentStepIsHidden = steps[currentStepIndex]?.hidden?.(form);
    if (currentStepIsHidden && visibleSteps.length > 0) {
      const firstVisibleIndex = visibleSteps[0].originalIndex;
      if (firstVisibleIndex !== currentStepIndex) {
        form.setValue("currentStepIndex", firstVisibleIndex);
      }
    }
  }, [currentStepIndex, steps, form, visibleSteps]);

  const currentStep = steps[currentStepIndex];
  const [isValidating, setIsValidating] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const isFirstStep = currentVisibleStepIndex === 0;
  const isLastStep = currentVisibleStepIndex === visibleSteps.length - 1;

  const validateStep = async (): Promise<boolean> => {
    setIsValidating(true);
    try {
      const formValues = form.getValues();
      const validationContext = {
        values: formValues,
        form,
        stepIndex: currentStepIndex,
      };

      // First, validate form fields if specified (this will show errors in the form)
      if (
        currentStep?.validateFields &&
        currentStep.validateFields.length > 0
      ) {
        const result = await form.trigger(currentStep.validateFields as any);
        if (!result) {
          setIsValidating(false);
          return false;
        }
      }

      // Run step-specific validation with form values and form instance
      if (currentStep?.onValidate) {
        const stepResult = await currentStep.onValidate(validationContext);
        if (!stepResult) {
          setIsValidating(false);
          return false;
        }
      }

      // Run global validation with form values and form instance
      if (onValidate) {
        const globalResult = await onValidate(validationContext);
        if (!globalResult) {
          setIsValidating(false);
          return false;
        }
      }

      setIsValidating(false);
      return true;
    } catch {
      setIsValidating(false);
      return false;
    }
  };

  const handleNext = async () => {
    // If on last step, handle submit instead
    if (isLastStep) {
      await handleSubmit();
      return;
    }

    const isValid = await validateStep();
    if (!isValid) {
      return;
    }

    if (onNext) {
      await onNext(currentStepIndex);
    }

    // Find the next visible step
    const nextVisibleIndex = currentVisibleStepIndex + 1;
    if (nextVisibleIndex < visibleSteps.length) {
      const nextOriginalIndex = visibleSteps[nextVisibleIndex].originalIndex;
      form.setValue("currentStepIndex", nextOriginalIndex);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const isValid = await validateStep();
      if (!isValid) {
        setIsSubmitting(false);
        return;
      }

      const formValues = form.getValues();
      const validationContext = {
        values: formValues,
        form,
        stepIndex: currentStepIndex,
      };

      if (onSubmit) {
        await onSubmit(validationContext);
      } else {
        // Default: trigger form submission if no custom handler
        form.handleSubmit(() => {})();
      }
    } catch (error) {
      console.error("Submit error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrevious = async () => {
    if (onPrevious) {
      await onPrevious(currentStepIndex);
    }

    // Find the previous visible step
    const prevVisibleIndex = currentVisibleStepIndex - 1;
    if (prevVisibleIndex >= 0) {
      const prevOriginalIndex = visibleSteps[prevVisibleIndex].originalIndex;
      form.setValue("currentStepIndex", prevOriginalIndex);
    }
  };

  const handleCancel = async () => {
    if (onCancel) {
      await onCancel();
    }
  };

  const handleSkip = async () => {
    if (onSkip) {
      await onSkip(currentStepIndex);
    }

    // Find the next visible step
    const nextVisibleIndex = currentVisibleStepIndex + 1;
    if (nextVisibleIndex < visibleSteps.length) {
      const nextOriginalIndex = visibleSteps[nextVisibleIndex].originalIndex;
      form.setValue("currentStepIndex", nextOriginalIndex);
    }
  };

  const nextButtonConfig = buttonConfig?.next || {};
  const previousButtonConfig = buttonConfig?.previous || {};
  const cancelButtonConfig = buttonConfig?.cancel || {};
  const skipButtonConfig = buttonConfig?.skip || {};
  const submitButtonConfig = buttonConfig?.submit || {};

  // Check if any fields in the current step are filled
  const fieldsToCheck = React.useMemo(
    () => currentStep?.skipCheckFields || currentStep?.validateFields || [],
    [currentStep?.skipCheckFields, currentStep?.validateFields],
  );

  // Always call useWatch - pass undefined if no fields to watch
  // This avoids conditional hook calls which violate React rules
  const watchedFieldValues = useWatch({
    control: form.control,
    name: fieldsToCheck.length > 0 ? (fieldsToCheck as any) : undefined,
  });

  // Convert to a map for easier access
  const watchedValuesMap = React.useMemo(() => {
    if (fieldsToCheck.length === 0) return {};
    if (!Array.isArray(watchedFieldValues)) {
      // If single value, create map with first field
      return fieldsToCheck.length > 0
        ? { [fieldsToCheck[0]]: watchedFieldValues }
        : {};
    }
    const result: Record<string, any> = {};
    fieldsToCheck.forEach((field, index) => {
      result[field] = watchedFieldValues[index];
    });
    return result;
  }, [fieldsToCheck, watchedFieldValues]);

  const areStepFieldsFilled = React.useMemo(() => {
    if (!currentStep?.skipable) return true; // If not skipable, always show Next
    if (fieldsToCheck.length === 0) return false; // If no fields to check, consider empty

    return fieldsToCheck.some((field) => {
      const value = watchedValuesMap[field];
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      if (typeof value === "string") {
        return value.trim().length > 0;
      }
      return value !== undefined && value !== null && value !== "";
    });
  }, [currentStep?.skipable, fieldsToCheck, watchedValuesMap]);

  // Determine if we should show Skip instead of Next
  const shouldShowSkip =
    currentStep?.skipable && !isLastStep && !areStepFieldsFilled;

  return (
    <MultiStepContentWidthContext.Provider value={contentWidth}>
      <Title className={className}>
        <div className="flex items-center gap-1">
          {title && (
            <>
              <span className="text-primary font-medium text-base">
                {title}
              </span>
              <IconRenderer
                name="arrow_right_outlined"
                className="w-4 h-4 text-primary mx-3"
              />
            </>
          )}
          {visibleSteps.map(({ step, originalIndex }, visibleIndex) => (
            <div key={step.id || originalIndex} className="flex items-center">
              <span
                className={cn(
                  "px-4 py-1 rounded-[8px]  text-fg-quinary text-sm font-normal inline-flex items-center gap-2",
                  currentStepIndex === originalIndex &&
                    "bg-primary 0 text-white font-medium mx-2",
                  originalIndex < currentStepIndex &&
                    "bg-transparent text-green-600 font-medium",
                )}
                aria-label={step.label}
              >
                {originalIndex < currentStepIndex && (
                  <span className="flex items-center justify-center w-4 h-4 rounded-full bg-green-600 text-white">
                    <CheckIcon className="w-[10px] h-[10px]" />
                  </span>
                )}
                {step.label}
              </span>
              {visibleIndex < visibleSteps.length - 1 && (
                <div
                  className={cn(
                    originalIndex < currentStepIndex
                      ? "h-[2px] w-8 bg-green-600 rounded-full"
                      : "flex items-center gap-[2px]",
                  )}
                >
                  {originalIndex >= currentStepIndex && (
                    <>
                      <div className="h-[2px] w-[6.5px] bg-utility-gray-800 rounded-full"></div>
                      <div className="h-[2px] w-[6.5px] bg-utility-gray-800 rounded-full"></div>
                      <div className="h-[2px] w-[6.5px] bg-utility-gray-800 rounded-full"></div>
                      <div className="h-[2px] w-[6.5px] bg-utility-gray-800 rounded-full"></div>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </Title>

      {currentStep?.withLocalization && <ToggleFormLangSlot />}

      {showActions && (
        <Actions className={className}>
          <div className="flex items-center gap-2">
            <Button
              variant={cancelButtonConfig.variant || "outline"}
              onClick={handleCancel}
              type="button"
              disabled={cancelButtonConfig.disabled || isValidating}
              className={cancelButtonConfig.className}
            >
              {cancelButtonConfig.label || "إلغاء"}
            </Button>

            {!isFirstStep && (
              <Button
                variant={previousButtonConfig.variant || "outline"}
                onClick={handlePrevious}
                type="button"
                disabled={previousButtonConfig.disabled || isValidating}
                className={previousButtonConfig.className}
              >
                {previousButtonConfig.label || "السابق"}
              </Button>
            )}

            {shouldShowSkip ? (
              <Button
                variant={skipButtonConfig.variant || "default"}
                onClick={handleSkip}
                type="button"
                disabled={skipButtonConfig.disabled || isValidating}
                className={skipButtonConfig.className}
              >
                {skipButtonConfig.label || "تخطي"}
              </Button>
            ) : !isLastStep ? (
              currentStep?.hideNextButton ? null : (
                <Button
                  variant={nextButtonConfig.variant || "default"}
                  onClick={handleNext}
                  type="button"
                  disabled={nextButtonConfig.disabled || isValidating}
                  className={nextButtonConfig.className}
                >
                  {nextButtonConfig.label || "التالي"}
                </Button>
              )
            ) : customSubmitAction ? (
              customSubmitAction
            ) : (
              <Button
                variant={submitButtonConfig.variant || "default"}
                onClick={handleSubmit}
                type="button"
                disabled={
                  submitButtonConfig.disabled || isValidating || isSubmitting
                }
                className={submitButtonConfig.className}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {submitButtonConfig.label || "جاري الإرسال..."}
                  </>
                ) : (
                  submitButtonConfig.label || "إرسال"
                )}
              </Button>
            )}
          </div>
        </Actions>
      )}

      <MultiStepContentSlot
        title={currentStep?.title}
        description={currentStep?.description}
        className={className}
        contentClassName={contentClassName}
        titleDescriptionClassName={titleDescriptionClassName}
      >
        {currentStep?.component}
      </MultiStepContentSlot>
    </MultiStepContentWidthContext.Provider>
  );
}
