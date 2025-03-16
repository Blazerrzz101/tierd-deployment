"use client"

import { Product } from "@/types"
import { Card } from "@/components/ui/card"
import { Cpu, Gauge, Battery, Wifi, Weight, Mouse } from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface ProductSpecsSectionProps {
  product: Product
}

const specCategories = {
  performance: {
    icon: Cpu,
    specs: ['sensor', 'dpi']
  },
  physical: {
    icon: Weight,
    specs: ['weight', 'buttons']
  },
  connectivity: {
    icon: Wifi,
    specs: ['connection', 'battery']
  }
}

export function ProductSpecsSection({ product }: ProductSpecsSectionProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Technical Specifications</h3>
      
      <Accordion type="single" collapsible className="w-full">
        {Object.entries(specCategories).map(([category, { icon: Icon, specs }]) => (
          <AccordionItem key={category} value={category}>
            <AccordionTrigger className="text-sm hover:no-underline">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="capitalize">{category}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pt-2">
                {specs.map(spec => (
                  <div key={spec} className="flex justify-between text-sm">
                    <span className="text-muted-foreground capitalize">{spec}</span>
                    <span className="font-medium">{product.specs[spec]}</span>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}