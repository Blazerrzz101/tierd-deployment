"use client"

import { Product } from "@/types/product"
import { Card } from "@/components/ui/card"
import { 
  Cpu, 
  Gauge, 
  Battery, 
  Wifi, 
  Weight, 
  Headphones, 
  Monitor, 
  Keyboard,
  Info,
  Star,
  Award,
  Box,
  Mouse
} from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"

interface ProductSpecsSectionProps {
  product: Product
}

const categoryIcons = {
  'gaming-mice': Mouse,
  'gaming-keyboards': Keyboard,
  'gaming-headsets': Headphones,
  'gaming-monitors': Monitor,
} as const

const specCategories = {
  overview: {
    icon: Info,
    title: "Overview",
    specs: ['type', 'brand', 'model']
  },
  performance: {
    icon: Gauge,
    title: "Performance",
    specs: ['dpi', 'sensor', 'polling_rate', 'response_time', 'refresh_rate']
  },
  physical: {
    icon: Box,
    title: "Physical",
    specs: ['weight', 'dimensions', 'size', 'panel', 'resolution']
  },
  features: {
    icon: Award,
    title: "Features",
    specs: ['features', 'rgb', 'buttons', 'switches']
  },
  connectivity: {
    icon: Wifi,
    title: "Connectivity",
    specs: ['connection', 'battery_life', 'cable', 'ports']
  }
}

export function ProductSpecsSection({ product }: ProductSpecsSectionProps) {
  const CategoryIcon = categoryIcons[product.category as keyof typeof categoryIcons] || Info
  const specs = product.specifications || {}

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-primary/10 rounded-lg">
          <CategoryIcon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Technical Specifications</h3>
          <p className="text-sm text-muted-foreground">
            Detailed specifications and features for {product.name}
          </p>
        </div>
      </div>
      
      <Accordion type="single" collapsible className="w-full">
        {Object.entries(specCategories).map(([key, { icon: Icon, title, specs: categorySpecs }]) => {
          const hasSpecs = categorySpecs.some(spec => spec in specs)
          if (!hasSpecs) return null

          return (
            <AccordionItem key={key} value={key}>
              <AccordionTrigger className="text-sm hover:no-underline">
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span>{title}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-2">
                  {categorySpecs.map(spec => {
                    if (!(spec in specs)) return null
                    const value = specs[spec]
                    
                    if (Array.isArray(value)) {
                      return (
                        <div key={spec} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground capitalize">
                              {spec.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {value.map((item, i) => (
                              <Badge key={i} variant="secondary">
                                {item}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )
                    }

                    return (
                      <div key={spec} className="flex justify-between text-sm items-center">
                        <span className="text-muted-foreground capitalize">
                          {spec.replace(/_/g, ' ')}
                        </span>
                        <span className="font-medium">{value}</span>
                      </div>
                    )
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    </Card>
  )
}