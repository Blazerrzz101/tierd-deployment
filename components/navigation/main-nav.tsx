import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { Badge } from "@/components/ui/badge"

interface MainNavProps {
  items?: NavItem[]
}

interface NavItem {
  title: string
  href: string
  description?: string
  icon?: keyof typeof Icons
  disabled?: boolean
  external?: boolean
  badge?: string
}

const defaultItems: NavItem[] = [
  {
    title: "Products",
    href: "/products",
    description: "Browse all hardware products",
    icon: "logo",
  },
  {
    title: "Rankings",
    href: "/rankings",
    description: "View top-rated hardware",
    icon: "logo",
    badge: "Popular"
  },
  {
    title: "Categories",
    href: "/categories",
    description: "Explore product categories",
    icon: "logo",
  },
  {
    title: "Showcase",
    href: "/showcase",
    description: "Featured products and builds",
    icon: "logo",
  },
]

export function MainNav({ items = defaultItems }: MainNavProps) {
  const pathname = usePathname()

  return (
    <div className="flex gap-6 md:gap-10">
      <Link href="/" className="flex items-center space-x-2">
        <Icons.logo className="h-6 w-6 text-primary" />
        <span className="inline-block font-heading font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80">
          HardwareRank
        </span>
      </Link>
      <nav className="hidden md:flex gap-0.5">
        {items?.map((item, index) => {
          const Icon = item.icon ? Icons[item.icon] : Icons.logo;
            
          if (item.disabled) {
            return (
              <span
                key={index}
                className={cn(
                  "group relative flex items-center px-3 py-2 text-sm font-medium text-muted-foreground opacity-60"
                )}
              >
                {item.title}
              </span>
            )
          }

          return (
            <Link
              key={index}
              href={item.href}
              target={item.external ? "_blank" : undefined}
              rel={item.external ? "noreferrer" : undefined}
              className={cn(
                "group relative flex items-center px-3 py-2 text-sm font-medium transition-colors hover:text-primary rounded-md",
                pathname === item.href
                  ? "text-primary bg-background border-b-2 border-primary"
                  : "text-muted-foreground hover:bg-muted/50",
              )}
            >
              <span className="flex items-center gap-1.5">
                {Icon && <Icon className="h-4 w-4" />}
                {item.title}
                {item.external && (
                  <Icons.logo className="h-3 w-3" />
                )}
              </span>
              {item.badge && (
                <Badge 
                  variant="outline" 
                  className="ml-2 bg-primary/10 text-primary border-primary/20 text-[10px] px-1.5 py-0 h-4"
                >
                  {item.badge}
                </Badge>
              )}
              
              {/* Hover tooltip */}
              {item.description && (
                <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="bg-popover text-popover-foreground shadow-lg rounded-md py-1.5 px-3 text-xs w-44 whitespace-normal">
                    {item.description}
                  </div>
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-popover"></div>
                </div>
              )}
            </Link>
          )
        })}
      </nav>
    </div>
  )
} 