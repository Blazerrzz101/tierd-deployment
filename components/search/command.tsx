"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Search as SearchIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Product } from "@/types"
import { Badge } from "@/components/ui/badge"

interface SearchCommandProps {
  products: Product[]
}

export function SearchCommand({ products }: SearchCommandProps) {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState("")

  const suggestions = React.useMemo(() => {
    if (!value) return products.slice(0, 5)
    const searchTerm = value.toLowerCase()
    return products
      .filter(
        product =>
          product.name.toLowerCase().includes(searchTerm) ||
          product.description.toLowerCase().includes(searchTerm)
      )
      .slice(0, 10)
  }, [products, value])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="relative h-14 w-full justify-between border-2 bg-background px-4 text-left text-lg shadow-lg hover:bg-background/90 sm:text-xl"
        >
          <div className="flex items-center">
            <SearchIcon className="mr-3 h-5 w-5 shrink-0 opacity-50" />
            {value || "Search gaming accessories..."}
          </div>
          <ChevronsUpDown className="ml-2 h-5 w-5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search gaming accessories..."
            value={value}
            onValueChange={setValue}
          />
          <CommandList>
            <CommandEmpty className="py-6 text-center text-sm">
              No products found.
            </CommandEmpty>
            <CommandGroup heading="Top Products">
              {suggestions.map((product) => (
                <CommandItem
                  key={product.id}
                  value={product.name}
                  onSelect={(currentValue) => {
                    setValue(currentValue)
                    setOpen(false)
                  }}
                  className="flex items-center justify-between py-3"
                >
                  <div className="flex flex-col">
                    <div className="flex items-center">
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === product.name ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span>{product.name}</span>
                    </div>
                    <span className="ml-6 text-sm text-muted-foreground">
                      {product.category}
                    </span>
                  </div>
                  <Badge variant="secondary" className="ml-2">
                    Rank #{product.rank}
                  </Badge>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}