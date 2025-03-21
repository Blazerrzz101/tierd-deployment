import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const categories = [
  { id: "all", name: "All Products" },
  { id: "monitors", name: "Monitors" },
  { id: "mice", name: "Mice" },
  { id: "keyboards", name: "Keyboards" },
  { id: "headsets", name: "Headsets" },
];

interface CategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export function CategoryFilter({
  selectedCategory,
  onCategoryChange,
}: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {categories.map((category) => (
        <Button
          key={category.id}
          variant={selectedCategory === category.id ? "default" : "outline"}
          size="sm"
          onClick={() => onCategoryChange(category.id)}
          className={cn(
            "hover:bg-muted",
            selectedCategory === category.id && 
            "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
        >
          {category.name}
        </Button>
      ))}
    </div>
  );
} 