import * as React from 'react'
import { cn } from "@/lib/utils"
import { Category } from "@/types/product"
import { Icons } from "@/components/icons"
import { motion } from 'framer-motion'

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
    <div className="w-full overflow-x-auto no-scrollbar py-4">
      <div className="flex space-x-2 min-w-max px-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelectCategory(null)}
          className={cn(
            "relative flex h-9 items-center rounded-lg border border-input px-4 py-2 text-sm font-medium transition-colors",
            "hover:border-primary/50 hover:bg-accent hover:text-accent-foreground",
            selectedCategory === null
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background text-foreground"
          )}
        >
          <div className="flex items-center gap-2">
            <Icons.logo className="h-3.5 w-3.5" />
            <span>All</span>
          </div>
          
          {selectedCategory === null && (
            <motion.div 
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-foreground/50" 
              layoutId="categoryIndicator"
            />
          )}
        </motion.button>
        
        {categories.map((category) => (
          <motion.button
            key={category.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectCategory(category.id)}
            className={cn(
              "relative flex h-9 items-center rounded-lg border border-input px-4 py-2 text-sm font-medium transition-colors",
              "hover:border-primary/50 hover:bg-accent hover:text-accent-foreground",
              selectedCategory === category.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-foreground"
            )}
          >
            <div className="flex items-center gap-2">
              <Icons.logo className="h-3.5 w-3.5" />
              <span>{category.name}</span>
            </div>
            
            {selectedCategory === category.id && (
              <motion.div 
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-foreground/50" 
                layoutId="categoryIndicator"
              />
            )}
          </motion.button>
        ))}
      </div>
    </div>
  )
} 