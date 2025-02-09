import { categories } from "@/lib/data"
import { Badge } from "@/components/ui/badge"
import { Filter, TrendingUp } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter, usePathname } from "next/navigation"
import { useCategoryAnalytics } from "@/hooks/use-category-analytics"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export function CategoryBar() {
  const router = useRouter()
  const pathname = usePathname()
  const { trendingCategories, trackView, trackClick } = useCategoryAnalytics()

  const handleCategoryClick = (categoryId: string) => {
    // Track the click
    trackClick(categoryId)

    // If we're not on the rankings page, navigate to it
    if (!pathname.includes('/rankings')) {
      router.push(`/rankings?category=${categoryId}`)
      return
    }
  }

  // Track view when category becomes visible
  const handleCategoryView = (categoryId: string) => {
    trackView(categoryId)
  }

  return (
    <div className="w-full bg-black/40 backdrop-blur-sm border-y border-white/10 sticky top-0 z-30">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-2 flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {categories.map(category => {
            const analytics = trendingCategories?.find(tc => tc.category_id === category.id)
            const isTrending = analytics?.trending_score 
              ? analytics.trending_score > 50
              : false

            return (
              <motion.div
                key={category.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onViewportEnter={() => handleCategoryView(category.id)}
              >
                <Tooltip>
                  <TooltipTrigger>
                    <Badge
                      variant="outline"
                      className="cursor-pointer transition-all duration-300 whitespace-nowrap
                               hover:bg-[#ff4b26]/10 hover:text-[#ff4b26] hover:border-[#ff4b26]
                               group relative"
                      onClick={() => handleCategoryClick(category.id)}
                    >
                      <Filter className="mr-1 h-3 w-3" />
                      {category.name}
                      <span className="ml-1.5 text-xs text-white/50">
                        {category.count}
                      </span>
                      
                      {/* Trending indicator */}
                      <AnimatePresence>
                        {isTrending && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0 }}
                            className="absolute -top-1 -right-1 bg-[#ff4b26] rounded-full p-0.5"
                          >
                            <TrendingUp className="h-2 w-2 text-white" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-xs space-y-1">
                      <p>{category.description}</p>
                      {analytics && (
                        <div className="text-white/50">
                          {analytics.views.toLocaleString()} views •{" "}
                          {analytics.conversion_rate.toFixed(1)}% engagement
                        </div>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Gradient fade for overflow */}
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-black/40 to-transparent pointer-events-none" />
    </div>
  )
} 