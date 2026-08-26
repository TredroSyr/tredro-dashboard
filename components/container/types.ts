import { iconName } from "@/assets/icons/iconRenderer/types";

import { UseFormReturn, FieldValues } from "react-hook-form";
import * as React from "react";

import type { ContentHeaderSlots } from "./constants";

export interface MultiStepValidationContext<
  TFieldValues extends FieldValues = FieldValues,
> {
  values: TFieldValues;
  form: UseFormReturn<TFieldValues>;
  stepIndex: number;
}

/**
 * Slot types that can be registered in the Container system
 */
export type SlotType =
  | "headerList"
  | "title"
  | "description"
  | "breadcrumb"
  | "actions"
  | "toggleFormLang"
  | "sidebar"
  | "contentHead"
  | "content";

/**
 * Data structure for a registered slot
 */
export interface SlotData {
  type: SlotType;
  content: React.ReactNode;
  key: string;
  originalKey?: string; // For hide slots, stores the original key they're hiding
  renderContent?: () => React.ReactNode; // Optional render function to preserve contexts
}

/**
 * Context value provided by Container
 */
export interface ContainerContextValue {
  registerSlot: (slot: SlotData) => void;
  unregisterSlot: (key: string) => void;
  fullSize: boolean;
  hasHeaderList: boolean;
  hasPageNavbar: boolean;
  headerSlots: ContentHeaderSlots;
  resolveHref: (href: string) => string;
  setFormInstance?: (form: UseFormReturn<FieldValues> | null) => void;
}

/**
 * Props for the root Container component
 */
export interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  fullSize?: boolean;
  /** Defaults to true. Set false when the layout has no expert/super-admin top navbar (e.g. settings). */
  hasPageNavbar?: boolean;
}

/**
 * Props for SlotComponent
 */
export interface SlotComponentProps {
  children: React.ReactNode;
  slotType: SlotType;
  className?: string;
  style?: React.CSSProperties;
  /**
   * Optional custom key for the slot.
   * If not provided, a random key will be generated.
   */
  slotKey?: string;
  /**
   * If true, registers the slot with null content to hide slots with the same key.
   */
  hide?: boolean;
}

/**
 * Sidebar navigation item
 */
export type SidebarNavItem = {
  label: string;
  href: string;
  icon?: iconName;
  exact?: boolean;
  /**
   * Disables the link (non-clickable + disabled styling)
   */
  disabled?: boolean;
  /**
   * Same as disabled, but also shows a lock icon at the inline-end of the row
   */
  locked?: boolean;
};

/**
 * Props for Sidebar component
 */
export interface SidebarProps {
  children?: React.ReactNode;
  className?: string;
  items?: SidebarNavItem[];
  basePath?: string;
  showBorder?: boolean;
  hide?: boolean;
  isLoading?: boolean;
}

/**
 * Props for ContentHead component
 */
export interface ContentHeadProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Props for ContentSticky component
 */
export interface ContentStickyProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Props for Aside component
 */
export interface AsideProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Props for Content component
 */
export interface ContentProps {
  children: React.ReactNode;
  className?: string;
  /**
   * If true, removes overflow-y-auto from the content container
   * Useful when children handle their own scrolling (e.g., InfiniteScrollContainer)
   */
  noScroll?: boolean;
}

/**
 * Props for Title component
 */
export interface TitleProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Props for Description component
 */
export interface DescriptionProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Props for Actions component
 */
export interface ActionsProps {
  children?: React.ReactNode;
  className?: string;
  /**
   * Optional key to identify this actions slot.
   * If multiple Actions components share the same key, they will be grouped together.
   */
  actionKey?: string;
  /**
   * If true, hides the Actions component with the same actionKey (typically used in child pages to hide layout actions).
   * When hide is true, children are ignored.
   */
  hide?: boolean;
}

/**
 * Props for HeaderList component
 */
export interface HeaderListProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Props for HeaderLinks component
 */
export interface HeaderLinksProps {
  items: HeaderLinkProps[];
}

/**
 * Props for HeaderLink component
 */
export interface HeaderLinkProps
  extends Omit<React.ComponentProps<"a">, "popover" | "href"> {
  label: string;
  href: string | ((id: string | number) => string);
  icon?: iconName;
  exact?: boolean;

  status?: "new" | "soon";
  permission?: string;
}

/**
 * Props for HeaderDropdown component
 */
export interface HeaderDropdownProps {
  label: string;
  links: HeaderLinkProps[];
  permission?: string;
}

/**
 * Props for Breadcrumb component
 */
export interface BreadcrumbProps {
  path?: {
    label: string;
    href: string;
    isTranslated?: boolean;
  }[];
  showTranslation?: boolean;
  pageName?: string | string[];
  hide?: boolean;
  invalidSegments?: string[];
  isLoading?: boolean;
}

/**
 * Props for Form component
 */
export interface FormProps<TFieldValues extends FieldValues = FieldValues> {
  form: UseFormReturn<TFieldValues>;
  children: React.ReactNode;
  /**
   * Optional boolean to disable the navigation guard.
   * If true, disables the guard regardless of form state.
   * If not provided, defaults to form.formState.isDirty
   */
  disableGuard?: boolean;
  /**
   * Optional allowed routes configuration that will be synced with the navigation guard store
   */

  onGuardSave?: () => Promise<boolean | void> | boolean | void;
}

/**
 * Step definition for MultiStep component
 */
export interface MultiStepStep {
  id?: string;
  label: string;
  title?: string;
  description?: string;
  component?: React.ReactNode;
  skipable?: boolean;
  /**
   * Field names to check if filled (for skip button logic)
   * If not provided, will use validateFields
   * Skip button appears only if step is skipable AND all these fields are empty
   */
  skipCheckFields?: string[];
  /**
   * Validation function for this step
   * Receives all form values, form instance, and step index
   * Return true or a Promise that resolves to true to proceed
   * Return false or throw/return rejected Promise to prevent navigation
   */
  onValidate?: (
    context: MultiStepValidationContext<FieldValues>,
  ) => boolean | Promise<boolean>;
  /**
   * Field names to validate for this step (if using react-hook-form validation)
   * These fields will be validated and errors will be shown in the form
   */
  validateFields?: string[];
  /**
   * If true, shows the language toggle for this step
   */
  withLocalization?: boolean;
  /**
   * Function to determine if this step should be hidden
   * Receives the form instance and should return true to hide the step
   */
  hidden?: (form: UseFormReturn<FieldValues>) => boolean;
  /**
   * If true, hides the "Next" button for this step (e.g. while an async
   * check the step is running is still pending or has failed).
   */
  hideNextButton?: boolean;
}

/**
 * Button configuration for MultiStep actions
 */
export interface MultiStepButtonConfig {
  label?: string;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  className?: string;
  disabled?: boolean;
}

/**
 * Props for MultiStep component
 */
export interface MultiStepProps {
  steps: MultiStepStep[];
  /**
   * Title to display before the steps (with chevron separator)
   */
  title?: string;
  className?: string;
  /**
   * @deprecated Use contentClassName instead for better Tailwind responsive support
   */
  contentWidth?: string | number;
  /**
   * Tailwind classes for controlling content width (e.g., "w-full md:w-3/4 lg:w-2/3 max-w-4xl")
   * This will override contentWidth if both are provided
   */
  contentClassName?: string;
  /**
   * Tailwind classes for controlling title and description width
   * Applied to the container div that wraps the title and description
   */
  titleDescriptionClassName?: string;
  onNext?: (currentStepIndex: number) => void | Promise<void>;
  onPrevious?: (currentStepIndex: number) => void | Promise<void>;
  onCancel?: () => void | Promise<void>;
  onSkip?: (currentStepIndex: number) => void | Promise<void>;
  /**
   * Submit handler called when clicking submit button on the last step
   * Receives all form values and form instance
   */
  onSubmit?: (
    context: MultiStepValidationContext<FieldValues>,
  ) => void | Promise<void>;
  /**
   * Global validation function called before moving to next step
   * If provided, this runs before the step's onValidate
   * Receives all form values, form instance, and step index
   */
  onValidate?: (
    context: MultiStepValidationContext<FieldValues>,
  ) => boolean | Promise<boolean>;
  showActions?: boolean;
  /**
   * Custom submit action (React node) to replace the default submit button on the last step
   * If provided, this will be rendered instead of the default submit button
   * The custom action should handle calling the submit handler if needed
   */
  customSubmitAction?: React.ReactNode;
  /**
   * Button configurations
   */
  buttonConfig?: {
    next?: MultiStepButtonConfig;
    previous?: MultiStepButtonConfig;
    cancel?: MultiStepButtonConfig;
    skip?: MultiStepButtonConfig;
    submit?: MultiStepButtonConfig;
  };
}
