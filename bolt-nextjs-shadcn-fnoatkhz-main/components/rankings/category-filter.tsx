"use client"

import { Category } from "@/types"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface CategoryFilterProps {
  categories: Category[]
  selectedCategory: string | null
  onSelectCategory: (categoryId: string | null) => void
}

export function CategoryFilter({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onSelectCategory(null)}
        className={cn(
          "hover:bg-muted",
          selectedCategory === null && "bg-primary text-primary-foreground hover:bg-primary/90"
        )}
      >
        All Categories
      </Button>
      {categories.map((category) => (
        <Button
          key={category.id}
          variant="outline"
          size="sm"
          onClick={() => onSelectCategory(category.id)}
          className={cn(
            "hover:bg-muted",
            selectedCategory === category.id && "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
        >
          {category.name}
        </Button>
      ))}
    </div>
  )
}