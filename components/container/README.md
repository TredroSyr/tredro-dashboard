# NewContainer - Compound Component System

A powerful, slot-based container system for Next.js applications that provides a flexible layout structure with automatic visual ordering, regardless of JSX component order.

## Features

- **Compound Component Architecture**: Similar to Radix UI, with a clean API
- **Automatic Visual Ordering**: Components render in the correct visual order, independent of JSX order
- **Slot-Based System**: Uses React Context to collect and organize child components
- **RTL Support**: Fully supports right-to-left layouts
- **TypeScript**: Fully typed for better developer experience
- **Flexible Layout**: Supports header navigation, breadcrumbs, sidebars, and content areas

## Installation

The component is already available in the project. Import it from:

```tsx
import { NewContainer } from '@/components/ui/NewContainer'
```

## Basic Usage

```tsx
import { NewContainer } from '@/components/ui/NewContainer'
import { Button } from '@/components/ui/button'

export default function MyPage() {
  return (
    <NewContainer>
      <NewContainer.Title>Page Title</NewContainer.Title>
      <NewContainer.Description>Page description goes here</NewContainer.Description>
      <NewContainer.Actions>
        <Button>Save</Button>
      </NewContainer.Actions>
      <NewContainer.Content>
        <p>Your page content here</p>
      </NewContainer.Content>
    </NewContainer>
  )
}
```

## Visual Order

**Important**: The visual order is **always** controlled by the container, not by your JSX order:

1. **HeaderList** (top navigation tabs) - if present
2. **Header** (Title, Description, Breadcrumb, Actions, ToggleFormLang)
3. **Sidebar** (left side, below header)
4. **Content** (right of sidebar)

Even if you write `<NewContainer.Content />` before `<NewContainer.Title />` in JSX, the final rendered view will still place Title at the top, then Sidebar, then Content.

## Components

### NewContainer (Root)

The root container component that wraps all other components.

**Props:**

- `children`: React.ReactNode - Child components (slots)
- `className?`: string - Additional CSS classes
- `fullSize?`: boolean - Whether the container should take full size (default: `false`)

**Example:**

```tsx
<NewContainer className="my-custom-class" fullSize={false}>
  {/* child components */}
</NewContainer>
```

### NewContainer.Title

Displays the page title.

**Props:**

- `children`: React.ReactNode - The title text
- `className?`: string - Additional CSS classes

**Example:**

```tsx
<NewContainer.Title>Product Details</NewContainer.Title>
```

### NewContainer.Description

Displays the page description.

**Props:**

- `children`: React.ReactNode - The description text
- `className?`: string - Additional CSS classes

**Example:**

```tsx
<NewContainer.Description>Edit product information and settings</NewContainer.Description>
```

### NewContainer.Breadcrumb

Navigation breadcrumb component. Supports both custom paths and automatic path generation.

**Props:**

- `path?`: Array<{ label: string; href: string; isTranslated?: boolean }> - Custom breadcrumb path
- `pageName?`: string | Record<string, string> - Custom name for dynamic route segments (IDs)
- Other `nav` element props

**Example with automatic path:**

```tsx
<NewContainer.Breadcrumb pageName="My Product" />
```

**Example with custom path:**

```tsx
<NewContainer.Breadcrumb
  path={[
    { label: 'Home', href: '/expert' },
    { label: 'Products', href: '/expert/products' },
    { label: 'My Product', href: '/expert/products/123' },
  ]}
/>
```

### NewContainer.Actions

Container for action buttons (Save, Cancel, etc.).

**Props:**

- `children`: React.ReactNode - Action buttons
- `className?`: string - Additional CSS classes

**Example:**

```tsx
<NewContainer.Actions>
  <div className="flex gap-3">
    <Button variant="outline">Cancel</Button>
    <Button>Save</Button>
  </div>
</NewContainer.Actions>
```

### NewContainer.ToggleFormLang

Language toggle component for forms (AR/EN).

**Props:**

- `errors?`: FieldErrors - Form errors from react-hook-form (optional)

**Example:**

```tsx
<NewContainer.ToggleFormLang errors={formErrors} />
```

### NewContainer.HeaderList

Top navigation tabs container. Wraps header navigation links and dropdowns.

**Props:**

- `children`: React.ReactNode - HeaderLink, HeaderLinks, or HeaderDropdown components
- `className?`: string - Additional CSS classes

**Sub-components:**

- `NewContainer.HeaderList.Link` - Individual navigation link
- `NewContainer.HeaderList.Links` - Multiple links from an array
- `NewContainer.HeaderList.Dropdown` - Dropdown menu

**Example:**

```tsx
<NewContainer.HeaderList>
  <NewContainer.HeaderList.Dropdown
    label="Products"
    links={[
      { label: 'Bundles', href: '', icon: 'languages_filled' },
      { label: 'Courses', href: 'page-2', icon: 'book_outlined' },
    ]}
  />
  <NewContainer.HeaderList.Links
    items={[
      { label: 'Basic Information', href: '', icon: 'info_filled' },
      { label: 'Content', href: 'page-2', icon: 'admin_outlined' },
    ]}
  />
</NewContainer.HeaderList>
```

#### NewContainer.HeaderList.Link

Individual navigation link in header list.

**Props:**

- `label`: string - Link label
- `href`: string - Link URL (relative or absolute)
- `icon?`: iconName - Icon name (optional)
- `exact?`: boolean - Whether to match exact path (default: `false`)
- Other `a` element props

**Example:**

```tsx
<NewContainer.HeaderList.Link label="Products" href="/products" icon="products_filled" />
```

#### NewContainer.HeaderList.Links

Renders multiple HeaderLink components from an array.

**Props:**

- `items`: Array<{ label: string; href: string; icon?: iconName; exact?: boolean }>

**Example:**

```tsx
<NewContainer.HeaderList.Links
  items={[
    { label: 'Basic Information', href: '', icon: 'info_filled' },
    { label: 'Content', href: 'page-2', icon: 'admin_outlined' },
  ]}
/>
```

#### NewContainer.HeaderList.Dropdown

Dropdown menu in header list.

**Props:**

- `label`: string - Dropdown trigger label
- `links?`: Array<{ label: string; href: string; icon?: iconName; style?: string }>
- Other `ul` element props

**Example:**

```tsx
<NewContainer.HeaderList.Dropdown
  label="Products"
  links={[
    { label: 'Bundles', href: '', icon: 'languages_filled' },
    { label: 'Courses', href: 'page-2', icon: 'book_outlined' },
  ]}
/>
```

### NewContainer.Sidebar

Sidebar navigation component. Supports two modes: custom children or items array.

**Props:**

- `children?`: React.ReactNode - Custom sidebar content (takes precedence over items)
- `items?`: Array<{ label: string; href: string; icon?: iconName }> - Navigation items array
- `basePath?`: string - Base path for resolving relative hrefs (strips locale prefix)
- `showBorder?`: boolean - Whether to show trailing border (default: `true`)
- `className?`: string - Additional CSS classes

**Example with items array:**

```tsx
<NewContainer.Sidebar
  basePath="/expert/products/bundles"
  items={[
    { label: 'Basic Information', href: '', icon: 'bundle_outlined' },
    { label: 'Content', href: 'content', icon: 'book_outlined' },
    { label: 'Settings', href: 'settings', icon: 'settings_outlined' },
  ]}
/>
```

**Example with custom children:**

```tsx
<NewContainer.Sidebar>
  <div className="p-4">
    <h3>Custom Sidebar</h3>
    <nav>{/* Your custom navigation */}</nav>
  </div>
</NewContainer.Sidebar>
```

**Note on basePath**: When using `basePath`, provide the path **after** the locale prefix. For example:

- ✅ Correct: `basePath="/expert/products/bundles"`
- ❌ Wrong: `basePath="/expert/products/bundles"`

The component automatically handles locale prefixes.

### NewContainer.Content

Main content area component.

**Props:**

- `children`: React.ReactNode - Page content
- `className?`: string - Additional CSS classes

**Example:**

```tsx
<NewContainer.Content>
  <div className="space-y-6">
    <h2>Section Title</h2>
    <p>Your content here</p>
  </div>
</NewContainer.Content>
```

### NewContainer.Form

React Hook Form provider wrapper. Provides FormProvider context to all its children, allowing any child component to access the form context using `useFormContext` from react-hook-form. Can be placed anywhere inside NewContainer, including in inner layouts.

**Props:**

- `form`: UseFormReturn<TFieldValues> - The form instance returned from `useForm` hook
- `children`: React.ReactNode - React children (any NewContainer components or other content)

**Example in Layout (wrapping multiple pages):**

```tsx
// app/[locale]/(dashboard)/expert/(routes)/products/(routes)/bundles/[id]/layout.tsx
'use client'

import { NewContainer } from '@/components/ui/NewContainer'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const formSchema = z.object({
  name_ar: z.string().optional(),
  name_en: z.string().optional(),
  // ... other fields
})

type FormData = z.infer<typeof formSchema>

export default function BundleLayout({ children }: { children: React.ReactNode }) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name_ar: '',
      name_en: '',
    },
  })

  return (
    <NewContainer>
      <NewContainer.Sidebar items={[...]} />
      <NewContainer.Form form={form}>
        {children}
      </NewContainer.Form>
    </NewContainer>
  )
}
```

**Example in Child Page (accessing form context):**

```tsx
// app/[locale]/(dashboard)/expert/(routes)/products/(routes)/bundles/[id]/(information)/page.tsx
'use client'

import { NewContainer } from '@/components/ui/NewContainer'
import { useFormContext } from 'react-hook-form'

export default function InformationPage() {
  const form = useFormContext<FormData>() // Access form from parent layout

  return (
    <>
      <NewContainer.Title>Basic Information</NewContainer.Title>
      <NewContainer.Content>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          {/* Form fields can use form methods */}
          <input {...form.register('name_en')} />
        </form>
      </NewContainer.Content>
    </>
  )
}
```

**Note:** The Form component should be placed inside NewContainer, not wrapping it. This allows you to use it in inner layouts and provides form context to all child pages.

## Complete Example

```tsx
'use client'

import { NewContainer } from '@/components/ui/NewContainer'
import { Button } from '@/components/ui/button'

export default function ProductPage() {
  return (
    <NewContainer>
      {/* Top Navigation */}
      <NewContainer.HeaderList>
        <NewContainer.HeaderList.Dropdown
          label="Products"
          links={[
            { label: 'Bundles', href: '', icon: 'languages_filled' },
            { label: 'Courses', href: 'courses', icon: 'book_outlined' },
          ]}
        />
        <NewContainer.HeaderList.Links
          items={[
            { label: 'Basic Information', href: '', icon: 'info_filled' },
            { label: 'Content', href: 'content', icon: 'admin_outlined' },
          ]}
        />
      </NewContainer.HeaderList>

      {/* Header */}
      <NewContainer.Title>Product Details</NewContainer.Title>
      <NewContainer.Description>Edit your product information</NewContainer.Description>
      <NewContainer.ToggleFormLang />
      <NewContainer.Actions>
        <div className="flex gap-3">
          <Button variant="outline">Cancel</Button>
          <Button>Save</Button>
        </div>
      </NewContainer.Actions>
      <NewContainer.Breadcrumb pageName="My Product" />

      {/* Sidebar */}
      <NewContainer.Sidebar
        basePath="/expert/products/bundles/123"
        items={[
          { label: 'Basic Information', href: '', icon: 'bundle_outlined' },
          { label: 'Content', href: 'content', icon: 'book_outlined' },
          { label: 'Settings', href: 'settings', icon: 'settings_outlined' },
        ]}
      />

      {/* Content */}
      <NewContainer.Content>
        <div className="space-y-6">
          <h2>Product Information</h2>
          <form>{/* Your form fields */}</form>
        </div>
      </NewContainer.Content>
    </NewContainer>
  )
}
```

## Layout Example (Shared Sidebar)

You can use NewContainer in a layout file to share the sidebar across multiple pages:

```tsx
// app/[locale]/(dashboard)/expert/(routes)/products/layout.tsx
'use client'

import { NewContainer } from '@/components/ui/NewContainer'

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return (
    <NewContainer>
      <NewContainer.HeaderList>{/* Shared header navigation */}</NewContainer.HeaderList>

      <NewContainer.Sidebar
        basePath="/expert/products"
        items={[
          { label: 'Overview', href: '', icon: 'dashboard' },
          { label: 'Settings', href: 'settings', icon: 'settings_outlined' },
        ]}
      />

      {/* Pages will provide their own Title, Description, Actions, and Content */}
      {children}
    </NewContainer>
  )
}
```

Then in individual pages:

```tsx
// app/[locale]/(dashboard)/expert/(routes)/products/page.tsx
'use client'

import { NewContainer } from '@/components/ui/NewContainer'

export default function ProductsPage() {
  return (
    <>
      <NewContainer.Title>Products</NewContainer.Title>
      <NewContainer.Description>Manage your products</NewContainer.Description>
      <NewContainer.Content>{/* Page content */}</NewContainer.Content>
    </>
  )
}
```

## Relative Href Resolution

The NewContainer system automatically resolves relative hrefs based on the current route. This makes it easy to use relative paths:

```tsx
// If you're on /expert/products/bundles/123
<NewContainer.Sidebar
  basePath="/expert/products/bundles/123"
  items={[
    { label: 'Basic', href: '' }, // → /expert/products/bundles/123
    { label: 'Content', href: 'content' }, // → /expert/products/bundles/123/content
    { label: 'Settings', href: 'settings' }, // → /expert/products/bundles/123/settings
  ]}
/>
```

## Header Layout Logic

The header layout adapts based on which components are present:

1. **If Title/Description exist:**

   - Row 1: Title + Description (left) | ToggleFormLang (right) | Actions (right)
   - Row 2: Breadcrumb (full width, below)

2. **If no Title/Description, but Breadcrumb/Actions/Toggle exist:**
   - Row 1: Breadcrumb (left) | ToggleFormLang (right) | Actions (right)

The curve decoration icon is automatically shown when appropriate.

## Styling

- All components use Tailwind CSS classes
- RTL support is built-in using Tailwind's `rtl:` prefix
- Dark mode is handled automatically through theme tokens
- Colors come from Tailwind utilities or theme tokens (no hardcoded colors)

## TypeScript Support

All components are fully typed. You can import types if needed:

```tsx
import type {
  NewContainerProps,
  SidebarProps,
  BreadcrumbProps,
  // ... other types
} from '@/components/ui/NewContainer'
```

## Best Practices

1. **Use relative hrefs**: When possible, use relative hrefs with `basePath` for easier maintenance
2. **Layout vs Page**: Put shared components (HeaderList, Sidebar) in layout files, page-specific components (Title, Description, Content) in page files
3. **Component order doesn't matter**: Write components in any order - the visual order is controlled by the container
4. **Use items array for sidebars**: When you have a simple navigation list, use the `items` prop instead of custom children
5. **Custom breadcrumbs**: Use the `path` prop when you need full control over breadcrumb labels

## Troubleshooting

### Sidebar links not working

- Make sure you're providing the correct `basePath` (without locale prefix)
- Check that relative hrefs are correct

### Components not rendering

- Ensure all components are direct children of `<NewContainer>`
- Check that you're using the correct component names (e.g., `NewContainer.Title`, not `NewContainer.Header.Title`)

### Duplicate locale in URLs

- The `basePath` prop should not include locale prefix (`/en` or `/ar`)
- The component handles locale prefixes automatically

## See Also

- Example implementation: `app/[locale]/(dashboard)/expert/(routes)/container-example/`
