"use client"

import Link from "next/link"
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"

interface ProductLinkProps {
  href: string
  children: React.ReactNode
  className?: string
}

export function ProductLink({ href, children, className }: ProductLinkProps) {
  // Guard against undefined or empty hrefs
  if (!href) {
    console.warn('ProductLink received empty or undefined href')
    return <span className={className}>{children}</span>
  }

  // Remove any duplicate slashes and ensure proper format
  const formattedHref = href
    .replace(/\/+/g, '/') // Replace multiple slashes with single slash
    .replace(/^\/products\/products\//, '/products/') // Fix duplicate /products/ prefix
    .replace(/^(?!\/products\/)/, '/products/') // Ensure /products/ prefix

  // Get the full URL for the tooltip
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const fullUrl = `${baseUrl}${formattedHref}`

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href={formattedHref} className={className}>
            {children}
          </Link>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">{fullUrl}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}