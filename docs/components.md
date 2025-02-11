# Component Library Documentation

This document provides documentation for the reusable components in the Tier'd application.

## Table of Contents

1. [Authentication Components](#authentication-components)
2. [Product Components](#product-components)
3. [Thread Components](#thread-components)
4. [UI Components](#ui-components)
5. [Form Components](#form-components)

## Authentication Components

### AuthProvider

Provides authentication context to the application.

```tsx
// app/providers.tsx
import { AuthProvider } from "@/components/auth/auth-provider"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  )
}
```

### SignInForm

Sign in form component with email/password authentication.

```tsx
import { SignInForm } from "@/components/auth/sign-in-form"

export function SignInPage() {
  return (
    <SignInForm
      onSuccess={() => {
        // Handle successful sign in
      }}
    />
  )
}
```

Props:
- `onSuccess`: () => void
- `redirectTo`: string (optional)

### SignUpForm

Sign up form component for new user registration.

```tsx
import { SignUpForm } from "@/components/auth/sign-up-form"

export function SignUpPage() {
  return (
    <SignUpForm
      onSuccess={() => {
        // Handle successful sign up
      }}
    />
  )
}
```

Props:
- `onSuccess`: () => void
- `redirectTo`: string (optional)

## Product Components

### ProductCard

Displays a product with voting functionality.

```tsx
import { ProductCard } from "@/components/products/product-card"

export function ProductList({ products }) {
  return (
    <div className="grid gap-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onVote={(type) => {
            // Handle vote
          }}
        />
      ))}
    </div>
  )
}
```

Props:
- `product`: Product
- `onVote`: (type: 'up' | 'down') => void
- `className`: string (optional)

### ProductMentionInput

Input component with product mention suggestions.

```tsx
import { ProductMentionInput } from "@/components/products/product-mention-input"

export function ThreadForm() {
  return (
    <ProductMentionInput
      value={content}
      onChange={setContent}
      onMention={(product) => {
        // Handle product mention
      }}
    />
  )
}
```

Props:
- `value`: string
- `onChange`: (value: string) => void
- `onMention`: (product: Product) => void
- `placeholder`: string (optional)
- `disabled`: boolean (optional)

### ProductList

Displays a list of products with sorting and filtering.

```tsx
import { ProductList } from "@/components/products/product-list"

export function ProductsPage() {
  return (
    <ProductList
      category="keyboards"
      sort="votes"
      onSort={(sort) => {
        // Handle sort change
      }}
      onFilter={(category) => {
        // Handle category filter
      }}
    />
  )
}
```

Props:
- `category`: string (optional)
- `sort`: 'votes' | 'date' (optional)
- `onSort`: (sort: string) => void
- `onFilter`: (category: string) => void
- `className`: string (optional)

## Thread Components

### ThreadCard

Displays a thread with product mentions.

```tsx
import { ThreadCard } from "@/components/thread/thread-card"

export function ThreadList({ threads }) {
  return (
    <div className="space-y-4">
      {threads.map((thread) => (
        <ThreadCard
          key={thread.id}
          thread={thread}
          onMentionClick={(product) => {
            // Handle mention click
          }}
        />
      ))}
    </div>
  )
}
```

Props:
- `thread`: Thread
- `onMentionClick`: (product: Product) => void
- `className`: string (optional)

### ThreadForm

Form for creating or editing threads.

```tsx
import { ThreadForm } from "@/components/thread/thread-form"

export function CreateThreadPage() {
  return (
    <ThreadForm
      onSubmit={async (data) => {
        // Handle form submission
      }}
    />
  )
}
```

Props:
- `onSubmit`: (data: ThreadFormData) => Promise<void>
- `initialData`: Thread (optional)
- `className`: string (optional)

## UI Components

### Button

Reusable button component with variants.

```tsx
import { Button } from "@/components/ui/button"

export function Example() {
  return (
    <Button
      variant="primary"
      size="md"
      onClick={() => {
        // Handle click
      }}
    >
      Click me
    </Button>
  )
}
```

Props:
- `variant`: 'primary' | 'secondary' | 'ghost' | 'link'
- `size`: 'sm' | 'md' | 'lg'
- `onClick`: () => void
- `disabled`: boolean (optional)
- `loading`: boolean (optional)
- `className`: string (optional)
- `children`: React.ReactNode

### Card

Container component with consistent styling.

```tsx
import { Card } from "@/components/ui/card"

export function Example() {
  return (
    <Card>
      <Card.Header>
        <Card.Title>Title</Card.Title>
      </Card.Header>
      <Card.Content>
        Content goes here
      </Card.Content>
      <Card.Footer>
        Footer content
      </Card.Footer>
    </Card>
  )
}
```

Props:
- `className`: string (optional)
- `children`: React.ReactNode

### Dialog

Modal dialog component.

```tsx
import { Dialog } from "@/components/ui/dialog"

export function Example() {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={setIsOpen}
      title="Dialog Title"
    >
      Dialog content goes here
    </Dialog>
  )
}
```

Props:
- `open`: boolean
- `onOpenChange`: (open: boolean) => void
- `title`: string
- `description`: string (optional)
- `children`: React.ReactNode

## Form Components

### Input

Text input component with consistent styling.

```tsx
import { Input } from "@/components/ui/input"

export function Example() {
  return (
    <Input
      type="text"
      placeholder="Enter text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  )
}
```

Props:
- `type`: string
- `value`: string
- `onChange`: (e: ChangeEvent) => void
- `placeholder`: string (optional)
- `disabled`: boolean (optional)
- `error`: string (optional)
- `className`: string (optional)

### Select

Dropdown select component.

```tsx
import { Select } from "@/components/ui/select"

export function Example() {
  return (
    <Select
      value={value}
      onChange={setValue}
      options={[
        { label: "Option 1", value: "1" },
        { label: "Option 2", value: "2" }
      ]}
    />
  )
}
```

Props:
- `value`: string
- `onChange`: (value: string) => void
- `options`: Array<{ label: string, value: string }>
- `placeholder`: string (optional)
- `disabled`: boolean (optional)
- `error`: string (optional)
- `className`: string (optional)

### Textarea

Multiline text input component.

```tsx
import { Textarea } from "@/components/ui/textarea"

export function Example() {
  return (
    <Textarea
      placeholder="Enter text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      rows={4}
    />
  )
}
```

Props:
- `value`: string
- `onChange`: (e: ChangeEvent) => void
- `placeholder`: string (optional)
- `rows`: number (optional)
- `disabled`: boolean (optional)
- `error`: string (optional)
- `className`: string (optional)

## Hooks

### useAuth

Hook for accessing authentication state and methods.

```tsx
import { useAuth } from "@/hooks/use-auth"

export function Example() {
  const { user, signIn, signOut } = useAuth()

  return (
    <div>
      {user ? (
        <button onClick={signOut}>Sign Out</button>
      ) : (
        <button onClick={() => signIn(email, password)}>Sign In</button>
      )}
    </div>
  )
}
```

Returns:
- `user`: User | null
- `signIn`: (email: string, password: string) => Promise<void>
- `signUp`: (email: string, password: string) => Promise<void>
- `signOut`: () => Promise<void>
- `loading`: boolean

### useVote

Hook for managing product votes.

```tsx
import { useVote } from "@/hooks/use-vote"

export function Example({ product }) {
  const { vote, loading } = useVote(product)

  return (
    <button
      onClick={() => vote('up')}
      disabled={loading}
    >
      Upvote
    </button>
  )
}
```

Returns:
- `vote`: (type: 'up' | 'down') => Promise<void>
- `loading`: boolean
- `error`: Error | null

### useProductMentions

Hook for handling product mentions in text.

```tsx
import { useProductMentions } from "@/hooks/use-product-mentions"

export function Example() {
  const { mentions, parseMentions } = useProductMentions()

  return (
    <div>
      <textarea
        onChange={(e) => parseMentions(e.target.value)}
      />
      {mentions.map((mention) => (
        <div key={mention.id}>
          Mentioned: {mention.name}
        </div>
      ))}
    </div>
  )
}
```

Returns:
- `mentions`: Product[]
- `parseMentions`: (text: string) => void
- `loading`: boolean

## Utilities

### formatDate

Formats dates consistently across the application.

```tsx
import { formatDate } from "@/lib/utils"

export function Example({ date }) {
  return (
    <time dateTime={date}>
      {formatDate(date)}
    </time>
  )
}
```

### cn

Utility for combining class names with Tailwind CSS.

```tsx
import { cn } from "@/lib/utils"

export function Example({ className }) {
  return (
    <div className={cn(
      "base-styles",
      className
    )}>
      Content
    </div>
  )
}
```

## Theme

The application uses a consistent theme defined in `tailwind.config.js`:

```js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {...},
        secondary: {...},
        // ...
      },
      // ...
    }
  }
}
```

## Best Practices

1. Component Organization
   - Keep components focused and reusable
   - Use TypeScript for type safety
   - Follow consistent naming conventions

2. State Management
   - Use React hooks for local state
   - Implement proper loading states
   - Handle errors gracefully

3. Styling
   - Use Tailwind CSS utility classes
   - Follow design system guidelines
   - Ensure responsive design

4. Accessibility
   - Include proper ARIA attributes
   - Support keyboard navigation
   - Test with screen readers

5. Performance
   - Implement proper memoization
   - Optimize re-renders
   - Use proper loading strategies 