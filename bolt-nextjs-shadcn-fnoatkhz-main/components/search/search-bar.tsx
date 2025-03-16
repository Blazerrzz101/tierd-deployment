"use client"

import * as React from "react"
import { Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { products } from "@/lib/data"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function SearchBar() {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [sortAlphabetically, setSortAlphabetically] = React.useState(false)
  const [sortByPrice, setSortByPrice] = React.useState<'asc' | 'desc' | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const filteredProducts = React.useMemo(() => {
    let results = !query 
      ? products.slice(0, 5)
      : products.filter((product) =>
          product.name.toLowerCase().includes(query.toLowerCase()) ||
          product.description.toLowerCase().includes(query.toLowerCase()) ||
          product.category.toLowerCase().includes(query.toLowerCase())
        )

    // Apply sorting
    if (sortAlphabetically) {
      results = [...results].sort((a, b) => a.name.localeCompare(b.name))
    } else if (sortByPrice === 'asc') {
      results = [...results].sort((a, b) => a.price - b.price)
    } else if (sortByPrice === 'desc') {
      results = [...results].sort((a, b) => b.price - a.price)
    } else {
      results = results.sort((a, b) => a.rank - b.rank)
    }

    return results.slice(0, 10)
  }, [query, sortAlphabetically, sortByPrice])

  const clearSearch = () => {
    setQuery("")
    setSortAlphabetically(false)
    setSortByPrice(null)
    inputRef.current?.focus()
  }

  return (
    <>
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="relative h-16 w-full justify-start border-2 bg-background/5 px-6 text-lg shadow-lg hover:bg-accent sm:text-xl"
      >
        <Search className="mr-2 h-5 w-5 shrink-0 opacity-50" />
        <span className="inline-flex">Search gaming accessories...</span>
        <kbd className="pointer-events-none absolute right-6 top-[50%] hidden h-8 -translate-y-1/2 select-none items-center gap-1 rounded border bg-muted px-2 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] w-[90vw] max-w-3xl overflow-hidden rounded-lg border-0 bg-black p-0 shadow-lg">
          <DialogHeader>
            <DialogTitle className="px-4 pt-4">Search Products</DialogTitle>
          </DialogHeader>
          
          <div className="flex items-center justify-between border-b border-border/10 px-3">
            <div className="flex flex-1 items-center">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <Input
                ref={inputRef}
                placeholder="Search gaming accessories..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-14 border-0 bg-transparent text-lg outline-none placeholder:text-muted-foreground focus:border-0 focus:outline-none focus:ring-0"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSortAlphabetically(!sortAlphabetically)}
                className={sortAlphabetically ? "text-primary" : ""}
              >
                A-Z
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (!sortByPrice) setSortByPrice('asc')
                  else if (sortByPrice === 'asc') setSortByPrice('desc')
                  else setSortByPrice(null)
                }}
                className={sortByPrice ? "text-primary" : ""}
              >
                ${sortByPrice === 'asc' ? '↑' : sortByPrice === 'desc' ? '↓' : ''}
              </Button>
              {(query || sortAlphabetically || sortByPrice) && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearSearch}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-4">
            {filteredProducts.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No products found.
              </p>
            ) : (
              <div className="space-y-2">
                {filteredProducts.map((product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.id}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between rounded-lg p-4 transition-colors hover:bg-accent"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{product.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {product.category} • ${product.price}
                      </span>
                    </div>
                    <Badge variant="secondary">
                      Rank #{product.rank}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}