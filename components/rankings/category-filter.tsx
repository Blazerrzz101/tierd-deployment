"use client"

import { categories } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { Check, Keyboard, MousePointer, Monitor, Headphones, Gamepad, Armchair } from "lucide-react"
import { cn } from "@/lib/utils"

interface CategoryFilterProps {
  selectedCategory: string
  onCategoryChange: (category: string) => void
}

const categoryIcons: Record<string, React.ReactNode> = {
  'keyboards': <Keyboard className="h-4 w-4" />,
  'mice': <MousePointer className="h-4 w-4" />,
  'gaming-mice': <MousePointer className="h-4 w-4" />,
  'monitors': <Monitor className="h-4 w-4" />,
  'headsets': <Headphones className="h-4 w-4" />,
  'controllers': <Gamepad className="h-4 w-4" />,
  'chairs': <Armchair className="h-4 w-4" />
}

export function CategoryFilter({ selectedCategory, onCategoryChange }: CategoryFilterProps) {
  return (
    <div className="space-y-2">
      <div className="font-medium">Categories</div>
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant={selectedCategory === "all" ? "default" : "outline"}
          className="justify-start"
          onClick={() => onCategoryChange("all")}
        >
          <div className="w-5 h-5 mr-2 flex items-center justify-center">
            {selectedCategory === "all" ? (
              <Check className="h-4 w-4" />
            ) : (
              <span className="h-2 w-2 rounded-full bg-primary/40" />
            )}
          </div>
          All Products
        </Button>
        
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? "default" : "outline"}
            className={cn(
              "justify-start",
              selectedCategory === category.id ? "border-primary" : ""
            )}
            onClick={() => onCategoryChange(category.id)}
          >
            <div className="w-5 h-5 mr-2 flex items-center justify-center">
              {selectedCategory === category.id ? (
                <Check className="h-4 w-4" />
              ) : (
                categoryIcons[category.id] || <span className="h-2 w-2 rounded-full bg-primary/40" />
              )}
            </div>
            {category.name}
          </Button>
        ))}
      </div>
    </div>
  )
}