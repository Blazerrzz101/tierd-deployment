"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter 
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Search, 
  MessageSquare, 
  Tag as TagIcon,
  Filter, 
  ThumbsUp, 
  Users, 
  TrendingUp,
  Star,
  Tag,
  Clock,
  Plus,
  ChevronRight
} from "lucide-react"
import { mockThreads } from "@/lib/mock-threads"
import { products } from "@/lib/data"
import { categories } from "@/lib/data"
import { formatDistanceToNow } from "date-fns"
import { CreateThreadDialog } from "@/components/threads/create-thread-dialog"
import { useEnhancedAuth } from "@/hooks/enhanced-auth"
import { toast } from "@/components/ui/use-toast"
import Link from "next/link"
import { createProductUrl } from "@/utils/product-utils"
import { threadStore } from "@/lib/local-storage/thread-store"
import { Thread, ThreadUser } from "@/types/thread"
import { Product } from "@/types/product"
import { motion } from "framer-motion"

// Extend the Thread type to include category
interface ExtendedThread extends Thread {
  category?: string;
}

// Helper to convert mock thread to proper Thread format
const convertMockThread = (mockThread): ExtendedThread => {
  return {
    id: mockThread.id,
    localId: mockThread.id,
    title: mockThread.title,
    content: mockThread.content,
    user_id: mockThread.author?.id || "mock-user",
    created_at: mockThread.createdAt,
    updated_at: mockThread.createdAt,
    upvotes: mockThread.upvotes,
    downvotes: 0,
    mentioned_products: [],
    is_pinned: false,
    is_locked: false,
    user: {
      id: mockThread.author?.id || "mock-user",
      username: mockThread.author?.name || "Anonymous",
      avatar_url: mockThread.author?.image || null
    },
    taggedProducts: [],
    category: mockThread.category
  }
}

export default function CommunityPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [threads, setThreads] = useState<ExtendedThread[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user, isLoading: authLoading, isAuthenticated } = useEnhancedAuth()
  const router = useRouter()

  // Debug authentication state
  useEffect(() => {
    console.log("Community page auth state:", {
      isAuthenticated,
      isLoading: authLoading,
      user: user ? { id: user.id, name: user.name } : null,
      timestamp: new Date().toISOString()
    });
  }, [isAuthenticated, authLoading, user]);

  // Load threads from localStorage and merge with mock threads
  useEffect(() => {
    // Get threads from threadStore
    const storedThreads = threadStore.getThreads()
    
    // Convert mock threads to proper Thread format
    const formattedMockThreads = mockThreads.map(convertMockThread)
    
    // Combine and sort threads by creation date (newest first)
    const allThreads = [...storedThreads, ...formattedMockThreads]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    
    setThreads(allThreads)
    setIsLoading(false)
  }, [])

  // Filter threads based on search query and selected category
  const filteredThreads = threads.filter(thread => {
    const matchesSearch = !searchQuery || 
      thread.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      thread.content.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = !selectedCategory || thread.category === selectedCategory
    
    const matchesTab = activeTab === "all" || 
      (activeTab === "popular" && thread.upvotes > 5) ||
      (activeTab === "recent" && new Date(thread.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
    
    return matchesSearch && matchesCategory && matchesTab
  })

  // Handle creating a new thread
  const handleNewThread = () => {
    if (!isAuthenticated && !authLoading) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create a discussion thread",
        variant: "destructive",
      })
      router.push('/auth/sign-in?redirect=community')
      return
    }
    
    setIsCreateDialogOpen(true)
  }
  
  // Handle adding a new thread
  const handleThreadCreated = (newThread: ExtendedThread) => {
    setThreads(prev => [newThread, ...prev])
    toast({
      title: "Thread created",
      description: "Your discussion has been posted successfully",
    })
  }

  // Format category name for display
  const formatCategoryName = (category: string) => {
    return category.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  }

  // Get a color for the category badge
  const getCategoryColor = (category: string) => {
    const colors = {
      "keyboards": "bg-blue-100 text-blue-800 dark:bg-blue-800/20 dark:text-blue-300",
      "mice": "bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-300",
      "monitors": "bg-purple-100 text-purple-800 dark:bg-purple-800/20 dark:text-purple-300",
      "headsets": "bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-300",
      "default": "bg-gray-100 text-gray-800 dark:bg-gray-800/20 dark:text-gray-300"
    }
    return colors[category] || colors.default
  }

  // Get formatted time display
  const getTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch (e) {
      return "recently"
    }
  }
  
  // Animation variants
  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4 }
  }
  
  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  return (
    <>
      {/* Hero Section with Backdrop */}
      <div className="relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background/80 to-background z-0">
          <div 
            className="absolute inset-0 bg-[url('/grid.svg')] bg-fixed opacity-[0.03] pointer-events-none"
            style={{
              maskImage: 'radial-gradient(circle at center, black, transparent 80%)',
              WebkitMaskImage: 'radial-gradient(circle at center, black, transparent 80%)'
            }}
          />
          
          {/* Professional Gradient Orbs */}
          <motion.div
            className="pointer-events-none absolute -left-1/4 top-0 h-[800px] w-[800px] rounded-full bg-primary/5 blur-[120px]"
            animate={{
              x: [0, 100, 0],
              y: [0, 50, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
          
          <motion.div
            className="pointer-events-none absolute right-0 top-1/4 h-[600px] w-[600px] rounded-full bg-secondary/5 blur-[100px]"
            animate={{
              x: [0, -50, 0],
              y: [0, 100, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
        </div>
        
        {/* Hero Content */}
        <div className="relative z-10 py-16 sm:py-24">
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-2xl mx-auto mb-8"
            >
              <div className="inline-flex items-center rounded-lg border border-white/10 bg-black/30 px-4 py-2 shadow-xl backdrop-blur-sm mb-6">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
                  <span className="text-sm font-medium text-white">Enterprise-Grade Discussion Platform</span>
                </div>
              </div>
              
              <h1 className="text-4xl sm:text-5xl font-bold mb-4">
                <span className="block text-foreground/80">Community</span>
                <motion.span 
                  className="gradient-text"
                  animate={{
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    repeatType: "reverse",
                  }}
                  style={{ backgroundSize: "200% auto" }}
                >
                  Discussions
                </motion.span>
              </h1>
              
              <p className="body-large text-foreground/70 mt-4">
                Share your thoughts, ask questions, and connect with other professionals
                about the latest gaming gear and technology.
              </p>
            </motion.div>
            
            {/* Stats */}
            <motion.div 
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto"
            >
              {[
                { icon: <Users className="h-5 w-5 text-primary" />, value: "2.4K+", label: "Active Members" },
                { icon: <MessageSquare className="h-5 w-5 text-secondary" />, value: "14.7K+", label: "Discussions" },
                { icon: <Tag className="h-5 w-5 text-accent" />, value: "187+", label: "Products Discussed" },
                { icon: <Star className="h-5 w-5 text-yellow-400" />, value: "4.8", label: "Community Rating" },
              ].map((stat, i) => (
                <motion.div 
                  key={i}
                  variants={fadeIn}
                  className="glass px-4 py-3 text-center"
                >
                  <div className="flex items-center justify-center mb-2">{stat.icon}</div>
                  <div className="text-xl font-bold">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto py-12 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
          {/* Main content */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="space-y-6"
          >
            {/* Search and create */}
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <div className="relative flex-1">
                <div className="search-bar">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search discussions..." 
                    className="pl-9 bg-white/5 border-white/10 h-11"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              <Button 
                onClick={handleNewThread} 
                className="premium-button h-11"
                size="lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Discussion
              </Button>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-3 sm:w-[400px] p-1 bg-white/5 backdrop-blur-sm border border-white/10">
                <TabsTrigger 
                  value="all"
                  className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-none"
                >
                  All Discussions
                </TabsTrigger>
                <TabsTrigger 
                  value="recent"
                  className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-none"
                >
                  Recent
                </TabsTrigger>
                <TabsTrigger 
                  value="popular"
                  className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-none"
                >
                  Popular
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Discussion threads */}
            {filteredThreads.length > 0 ? (
              <motion.div 
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="space-y-4"
              >
                {filteredThreads.map((thread, index) => (
                  <motion.div 
                    key={thread.id}
                    variants={fadeIn}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="modern-card overflow-hidden transition-all hover:shadow-md border-white/5">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <Avatar className="hidden sm:flex h-10 w-10 ring-2 ring-white/10">
                            <AvatarImage src={thread.user.avatar_url || undefined} />
                            <AvatarFallback>{thread.user.username?.[0] || 'U'}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center flex-wrap gap-2 mb-1">
                              <h3 className="font-semibold text-base sm:text-lg hover:text-primary">
                                <Link href={`/community/${thread.localId || thread.id}`}>{thread.title}</Link>
                              </h3>
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${getCategoryColor(thread.category || '')}`}
                              >
                                {formatCategoryName(thread.category || '')}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="font-medium">{thread.user.username}</span>
                              <span>·</span>
                              <span className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {getTimeAgo(thread.created_at)}
                              </span>
                            </div>
                            
                            <p className="line-clamp-2 text-muted-foreground mt-2">
                              {thread.content}
                            </p>
                            
                            {/* Tagged products */}
                            {thread.taggedProducts && thread.taggedProducts.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-3">
                                {thread.taggedProducts.map((product: any) => (
                                  <Link 
                                    key={product.id} 
                                    href={`/products/${product.url_slug || product.id}`}
                                    className="inline-flex items-center gap-1 rounded-md bg-white/5 backdrop-blur-sm px-2 py-1 text-xs hover:bg-white/10 transition-colors border border-white/10"
                                  >
                                    <Tag className="h-3 w-3" />
                                    {product.name}
                                  </Link>
                                ))}
                              </div>
                            )}
                            
                            <div className="flex items-center gap-4 mt-3">
                              <div className="flex items-center gap-1 text-sm">
                                <div className="bg-white/10 rounded-full p-1">
                                  <ThumbsUp className="h-3 w-3 text-primary" />
                                </div>
                                <span>{thread.upvotes}</span>
                              </div>
                              <div className="flex items-center gap-1 text-sm">
                                <div className="bg-white/10 rounded-full p-1">
                                  <MessageSquare className="h-3 w-3 text-muted-foreground" />
                                </div>
                                <span>{0}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <Card className="glass border-white/10">
                  <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                    <MessageSquare className="h-12 w-12 text-muted-foreground/40 mb-4" />
                    <h3 className="font-medium text-lg mb-2">No discussions found</h3>
                    <p className="text-muted-foreground mb-6 max-w-md">
                      Try adjusting your search or category filters, or start a new discussion!
                    </p>
                    <Button onClick={handleNewThread} className="premium-button">
                      <Plus className="h-4 w-4 mr-2" />
                      Start Discussion
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </motion.div>

          {/* Sidebar */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="space-y-6"
          >
            {/* New Discussion Button (Mobile Only) */}
            <div className="lg:hidden">
              <Button onClick={handleNewThread} className="premium-button w-full">
                <Plus className="h-4 w-4 mr-2" />
                New Discussion
              </Button>
            </div>
            
            {/* Categories */}
            <Card className="glass border-white/10">
              <CardHeader className="pb-3">
                <div className="flex items-center">
                  <div className="h-2 w-2 rounded-full bg-primary mr-2"></div>
                  <CardTitle className="text-base font-medium">Categories</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="grid gap-1">
                <Button
                  variant={selectedCategory === null ? "default" : "ghost"}
                  className="justify-start h-auto py-2 bg-primary/20 text-primary hover:bg-primary/30 hover:text-primary"
                  onClick={() => setSelectedCategory(null)}
                >
                  <Users className="mr-2 h-4 w-4" />
                  All Categories
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "ghost"}
                    className={`justify-start h-auto py-2 ${
                      selectedCategory === category.id 
                        ? "bg-primary/20 text-primary hover:bg-primary/30 hover:text-primary" 
                        : "hover:bg-white/5"
                    }`}
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <TagIcon className="mr-2 h-4 w-4" />
                    {category.name}
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Popular discussions */}
            <Card className="glass border-white/10">
              <CardHeader className="pb-3">
                <div className="flex items-center">
                  <div className="h-2 w-2 rounded-full bg-secondary mr-2"></div>
                  <CardTitle className="text-base font-medium">Popular Discussions</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4">
                {threads
                  .sort((a, b) => b.upvotes - a.upvotes)
                  .slice(0, 5)
                  .map((thread) => (
                    <Link 
                      key={thread.id} 
                      href={`/community/${thread.localId || thread.id}`}
                      className="flex items-start gap-3 hover:bg-white/5 p-2 rounded-md transition-colors group"
                    >
                      <div className="bg-primary/20 rounded-full p-1.5 mt-0.5">
                        <ThumbsUp className="h-3 w-3 text-primary" />
                      </div>
                      <div>
                        <p className="line-clamp-2 text-sm font-medium group-hover:text-primary transition-colors">
                          {thread.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center">
                          <span className="flex items-center">
                            <ThumbsUp className="h-3 w-3 mr-1" />
                            {thread.upvotes}
                          </span>
                          <span className="mx-1">•</span>
                          <span className="flex items-center">
                            <MessageSquare className="h-3 w-3 mr-1" />
                            {0}
                          </span>
                        </p>
                      </div>
                    </Link>
                  ))}
                  
                <Link href="/community?tab=popular" className="text-xs text-muted-foreground hover:text-primary flex items-center justify-end mt-2">
                  View all popular discussions
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Link>
              </CardContent>
            </Card>

            {/* Community Guidelines */}
            <Card className="glass border-white/10 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-50"></div>
              <CardHeader className="pb-3 relative">
                <div className="flex items-center">
                  <div className="h-2 w-2 rounded-full bg-accent mr-2"></div>
                  <CardTitle className="text-base font-medium">Community Guidelines</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3 relative">
                <div className="flex gap-2">
                  <div className="rounded-full h-6 w-6 bg-primary/20 flex items-center justify-center text-xs font-medium">
                    1
                  </div>
                  <p className="text-sm">Be respectful to other community members</p>
                </div>
                <div className="flex gap-2">
                  <div className="rounded-full h-6 w-6 bg-primary/20 flex items-center justify-center text-xs font-medium">
                    2
                  </div>
                  <p className="text-sm">No spam or self-promotion</p>
                </div>
                <div className="flex gap-2">
                  <div className="rounded-full h-6 w-6 bg-primary/20 flex items-center justify-center text-xs font-medium">
                    3
                  </div>
                  <p className="text-sm">Tag products to make your posts more discoverable</p>
                </div>
                <div className="flex gap-2">
                  <div className="rounded-full h-6 w-6 bg-primary/20 flex items-center justify-center text-xs font-medium">
                    4
                  </div>
                  <p className="text-sm">Keep discussions on-topic</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Create thread dialog */}
      <CreateThreadDialog 
        open={isCreateDialogOpen} 
        onOpenChange={setIsCreateDialogOpen} 
        onThreadCreated={handleThreadCreated}
      />
    </>
  )
} 