"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const categories = [
  { id: "mice", label: "Mouse" },
  { id: "keyboards", label: "Keyboard" },
  { id: "headsets", label: "Headset" },
  { id: "monitors", label: "Monitor" }
]

interface CategoryTabsProps {
  selectedCategory: string
  onSelectCategory: (category: string) => void
}

export function CategoryTabs({ selectedCategory, onSelectCategory }: CategoryTabsProps) {
  return (
    <div className="flex gap-2">
      {categories.map((category) => (
        <Button
          key={category.id}
          variant={selectedCategory === category.id ? "default" : "outline"}
          onClick={() => onSelectCategory(category.id)}
          className="min-w-[100px] rounded-full"
        >
          {category.label}
        </Button>
      ))}
    </div>
  )
}