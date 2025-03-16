"use client"

import * as React from "react"
import { Search as SearchIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { generateSlug } from "@/lib/utils"

interface SearchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onSearch?: (value: string) => void
}

export function Search({ className, onSearch, ...props }: SearchProps) {
  const [value, setValue] = React.useState("")
  const router = useRouter()

  // Debounce search input
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (onSearch) {
        onSearch(value)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [value, onSearch])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && value.trim()) {
      const slug = generateSlug(value.trim())
      router.push(`/products/${slug}`)
    }
  }

  return (
    <div className={cn("relative", className)}>
      <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        {...props}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className="pl-9"
        placeholder="Search products..."
      />
    </div>
  )
}