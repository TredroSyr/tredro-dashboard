/**
 * NewContainer - Compound Component System
 *
 * A slot-based container system where visual order is controlled by the container,
 * not by JSX order. Similar to Radix UI's compound component pattern.
 *
 * Usage:
 * ```tsx
 * <NewContainer>
 *   <NewContainer.Content>Content first in JSX</NewContainer.Content>
 *   <NewContainer.Title>Title</NewContainer.Title>
 *   <NewContainer.Sidebar>Sidebar</NewContainer.Sidebar>
 * </NewContainer>
 * ```
 *
 * Visual result (regardless of JSX order):
 * - Header (Title, Description, Breadcrumb, Actions)
 * - Sidebar (left)
 * - Content (right)
 */

import { Actions } from "./Actions";
import { Aside } from "./Aside";
import { Breadcrumb } from "./Breadcrumb";
import { Content } from "./Content";
import { ContentSticky } from "./ContentSticky";
import { Description } from "./Description";

import {
  HeaderDropdown,
  HeaderLink,
  HeaderLinks,
  HeaderList,
} from "./HeaderList";
import { MultiStep } from "./MultiStep";
import { MultiStepContent } from "./MultiStepContent";
import { ContainerRoot } from "./Container";
import { Sidebar } from "./Sidebar";
import { Title } from "./Title";
import { ToggleFormLangSlot } from "./ToggleFormLang";

// Create compound component structure
const Container = ContainerRoot as typeof ContainerRoot & {
  HeaderList: typeof HeaderList & {
    Link: typeof HeaderLink;
    Links: typeof HeaderLinks;
    Dropdown: typeof HeaderDropdown;
  };
  Title: typeof Title;
  Description: typeof Description;
  Breadcrumb: typeof Breadcrumb;
  Actions: typeof Actions;
  ToggleFormLang: typeof ToggleFormLangSlot;
  Sidebar: typeof Sidebar;
  Content: typeof Content;
  ContentSticky: typeof ContentSticky;
  Aside: typeof Aside;

  MultiStep: typeof MultiStep;
  MultiStepContent: typeof MultiStepContent;
};

// Attach subcomponents
Container.HeaderList = HeaderList as typeof HeaderList & {
  Link: typeof HeaderLink;
  Links: typeof HeaderLinks;
  Dropdown: typeof HeaderDropdown;
};
Container.HeaderList.Link = HeaderLink;
Container.HeaderList.Links = HeaderLinks;
Container.HeaderList.Dropdown = HeaderDropdown;
Container.Title = Title;
Container.Description = Description;
Container.Breadcrumb = Breadcrumb;
Container.Actions = Actions;
Container.ToggleFormLang = ToggleFormLangSlot;
Container.Sidebar = Sidebar;
Container.Content = Content;
Container.ContentSticky = ContentSticky;
Container.Aside = Aside;

Container.MultiStep = MultiStep;
Container.MultiStepContent = MultiStepContent;

export { Container };
export type {
  ActionsProps,
  AsideProps,
  BreadcrumbProps,
  ContentProps,
  ContentStickyProps,
  DescriptionProps,
  FormProps,
  HeaderDropdownProps,
  HeaderLinkProps,
  HeaderLinksProps,
  HeaderListProps,
  MultiStepProps,
  MultiStepStep,
  ContainerProps,
  SidebarNavItem,
  SidebarProps,
  TitleProps,
} from "./types";
