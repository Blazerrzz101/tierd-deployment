"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { formatDistanceToNow } from "date-fns"
import { 
  ThumbsUp, 
  ThumbsDown, 
  MessageSquare, 
  Tag, 
  AlertTriangle,
  ArrowLeft,
  Flag,
  Heart,
  Reply,
  Clock,
  User,
  Calendar,
  Share,
  Link as LinkIcon
} from "lucide-react"
import { threadStore } from "@/lib/local-storage/thread-store"
import { mockThreads } from "@/lib/mock-threads"
import { useEnhancedAuth } from "@/hooks/enhanced-auth"
import { products } from "@/lib/data"
import Link from "next/link"
import { createProductUrl } from "@/utils/product-utils"
import { Thread } from "@/types/thread"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { motion } from "framer-motion"

// Extend the Thread type to include category
interface ExtendedThread extends Thread {
  category?: string;
}

// Convert mock thread to proper Thread format
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

// Generate mock comments
const generateMockComments = (threadId: string) => {
  const commentCount = Math.floor(Math.random() * 5) + 1
  const comments = []
  
  for (let i = 0; i < commentCount; i++) {
    comments.push({
      id: `comment_${threadId}_${i}`,
      content: `This is a mock comment ${i + 1} for thread ${threadId}. It contains some example text to demonstrate how comments appear in the thread detail view.`,
      user: {
        username: `User${i + 1}`,
        avatar_url: null
      },
      created_at: new Date(Date.now() - (i * 3600000)).toISOString(), // 1 hour intervals
      upvotes: Math.floor(Math.random() * 10),
      downvotes: Math.floor(Math.random() * 3)
    })
  }
  
  return comments
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

export default function ThreadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const threadId = params.threadId as string
  const { toast } = useToast()
  const { user, isAuthenticated, isLoading } = useEnhancedAuth()
  
  const [thread, setThread] = useState<ExtendedThread | null>(null)
  const [isThreadLoading, setIsThreadLoading] = useState(true)
  const [comments, setComments] = useState<any[]>([])
  const [commentText, setCommentText] = useState("")
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [userVote, setUserVote] = useState<null | 'up' | 'down'>(null)
  
  // Debug authentication state
  useEffect(() => {
    console.log("Thread detail page auth state:", {
      isAuthenticated,
      isLoading,
      user: user ? { id: user.id, name: user.name } : null,
      threadId,
      timestamp: new Date().toISOString()
    });
  }, [isAuthenticated, isLoading, user, threadId]);

  // Load thread data
  useEffect(() => {
    if (!threadId) return
    
    setIsThreadLoading(true)
    
    // Try to find thread in localStorage
    const storedThreads = threadStore.getThreads()
    const storedThread = storedThreads.find(t => 
      t.id === threadId || t.localId === threadId
    )
    
    // If found in localStorage
    if (storedThread) {
      setThread(storedThread)
      // Generate mock comments for the thread
      setComments(generateMockComments(threadId))
      setIsThreadLoading(false)
      return
    }
    
    // If not in localStorage, look in mock threads
    const mockThread = mockThreads.find(t => t.id === threadId)
    if (mockThread) {
      setThread(convertMockThread(mockThread))
      // Generate mock comments for the thread
      setComments(generateMockComments(threadId))
      setIsThreadLoading(false)
      return
    }
    
    // If not found anywhere
    setThread(null)
    setIsThreadLoading(false)
  }, [threadId])
  
  // Handle adding a comment
  const handleAddComment = () => {
    if (!commentText.trim()) return
    
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to add a comment",
        variant: "destructive"
      })
      router.push(`/auth/sign-in?redirect=community/${threadId}`)
      return
    }
    
    setIsSubmittingComment(true)
    
    // Create a new comment (this would normally be saved to a database)
    const newComment = {
      id: `comment_${Date.now()}`,
      content: commentText,
      user: {
        username: user?.name || user?.email?.split('@')[0] || 'Anonymous',
        avatar_url: user?.avatar_url
      },
      created_at: new Date().toISOString(),
      upvotes: 0,
      downvotes: 0
    }
    
    // Add to comments list
    setComments([newComment, ...comments])
    setCommentText("")
    setIsSubmittingComment(false)
    
    toast({
      title: "Comment added",
      description: "Your comment has been added to the discussion"
    })
  }
  
  // Handle voting
  const handleVote = (voteType: 'up' | 'down') => {
    if (!thread) return
    
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to vote on this discussion",
        variant: "destructive"
      })
      router.push(`/auth/sign-in?redirect=community/${threadId}`)
      return
    }
    
    // If user already voted this way, remove the vote
    if (userVote === voteType) {
      setUserVote(null)
      
      // Update thread vote count
      if (voteType === 'up') {
        setThread({...thread, upvotes: thread.upvotes - 1})
      } else {
        setThread({...thread, downvotes: thread.downvotes - 1})
      }
      
      return
    }
    
    // If user voted the other way, switch vote
    if (userVote !== null) {
      if (voteType === 'up') {
        setThread({
          ...thread, 
          upvotes: thread.upvotes + 1,
          downvotes: thread.downvotes - 1
        })
      } else {
        setThread({
          ...thread, 
          upvotes: thread.upvotes - 1,
          downvotes: thread.downvotes + 1
        })
      }
    } else {
      // If user hasn't voted yet
      if (voteType === 'up') {
        setThread({...thread, upvotes: thread.upvotes + 1})
      } else {
        setThread({...thread, downvotes: thread.downvotes + 1})
      }
    }
    
    setUserVote(voteType)
    
    toast({
      title: voteType === 'up' ? "Upvoted" : "Downvoted",
      description: `You ${voteType === 'up' ? 'upvoted' : 'downvoted'} this discussion`
    })
  }
  
  // Format a date for display
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch (e) {
      return "recently"
    }
  }
  
  // Format category name
  const formatCategoryName = (category: string) => {
    return category?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'General'
  }
  
  // Determine if user is the thread author
  const isAuthor = isAuthenticated && thread?.user_id === user?.id
  
  if (isThreadLoading) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="flex justify-center items-center py-12">
          <div className="glass p-8 flex flex-col items-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
            <span>Loading discussion...</span>
          </div>
        </div>
      </div>
    )
  }
  
  if (!thread) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Alert variant="destructive" className="mb-4 glass">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Thread not found</AlertTitle>
            <AlertDescription>
              The discussion you're looking for doesn't exist or has been removed.
            </AlertDescription>
          </Alert>
          <Button onClick={() => router.push('/community')} variant="outline" className="glass hover:bg-white/10">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Discussions
          </Button>
        </motion.div>
      </div>
    )
  }
  
  return (
    <div className="relative">
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background/80 to-background"></div>
        <div 
          className="absolute inset-0 bg-[url('/grid.svg')] bg-fixed opacity-[0.02]"
          style={{
            maskImage: 'radial-gradient(circle at center, black, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(circle at center, black, transparent 80%)'
          }}
        />
        {/* Professional Gradient Orbs */}
        <motion.div
          className="pointer-events-none absolute -left-1/3 top-0 h-[600px] w-[600px] rounded-full bg-primary/5 blur-[100px]"
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
          className="pointer-events-none absolute right-0 top-1/4 h-[500px] w-[500px] rounded-full bg-secondary/5 blur-[80px]"
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
      
      <div className="container relative z-10 max-w-4xl mx-auto py-10 px-4">
        {/* Breadcrumbs */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center text-sm text-muted-foreground mb-6"
        >
          <Link href="/community" className="hover:text-primary transition-colors">
            Discussions
          </Link>
          <span className="mx-2">/</span>
          <span className="truncate text-foreground/70">{thread.title}</span>
        </motion.div>
        
        {/* Thread */}
        <div className="space-y-8">
          {/* Thread header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="glass p-6 rounded-xl border border-white/10"
          >
            <h1 className="text-2xl font-bold sm:text-3xl mb-6">{thread.title}</h1>
            
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3">
                <Avatar className="ring-2 ring-white/10">
                  <AvatarImage src={thread.user.avatar_url || undefined} />
                  <AvatarFallback>{thread.user.username?.[0] || 'U'}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium flex items-center">
                    <User className="h-3.5 w-3.5 mr-1.5 text-primary" />
                    {thread.user.username}
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center">
                    <Calendar className="h-3.5 w-3.5 mr-1.5" />
                    {formatDate(thread.created_at)}
                  </div>
                </div>
              </div>
              
              <Badge variant="outline" className="ml-auto bg-white/5 border-white/10">
                {formatCategoryName(thread.category)}
              </Badge>

              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-white/5">
                <Share className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
          
          {/* Thread content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="prose prose-slate dark:prose-invert max-w-none glass p-6 rounded-xl border border-white/10"
          >
            <p>{thread.content}</p>
          </motion.div>
          
          {/* Tagged products */}
          {thread.taggedProducts && thread.taggedProducts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="glass p-6 rounded-xl border border-white/10 space-y-4"
            >
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Tag className="h-4 w-4 text-secondary" />
                Tagged Products
              </h3>
              <div className="flex flex-wrap gap-3">
                {thread.taggedProducts.map((product: any) => (
                  <Link 
                    key={product.id}
                    href={createProductUrl(product)}
                    className="flex items-center gap-2 bg-white/5 hover:bg-white/10 rounded-md p-2 text-sm transition-colors border border-white/10"
                  >
                    <LinkIcon className="h-3 w-3 text-primary" />
                    <div className="font-medium">{product.name}</div>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
          
          {/* Voting */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="flex items-center gap-4 glass p-4 rounded-xl border border-white/10 justify-center"
          >
            <Button 
              variant={userVote === 'up' ? "default" : "outline"}
              size="sm"
              onClick={() => handleVote('up')}
              className={`gap-2 ${userVote === 'up' ? 'bg-primary/20 hover:bg-primary/30 text-primary border-primary/30' : 'bg-white/5 hover:bg-white/10 border-white/10'}`}
            >
              <ThumbsUp className="h-4 w-4" />
              Upvote {thread.upvotes > 0 && `(${thread.upvotes})`}
            </Button>
            <Button 
              variant={userVote === 'down' ? "default" : "outline"}
              size="sm"
              onClick={() => handleVote('down')}
              className={`gap-2 ${userVote === 'down' ? 'bg-primary/20 hover:bg-primary/30 text-primary border-primary/30' : 'bg-white/5 hover:bg-white/10 border-white/10'}`}
            >
              <ThumbsDown className="h-4 w-4" />
              Downvote {thread.downvotes > 0 && `(${thread.downvotes})`}
            </Button>
          </motion.div>
          
          <Separator className="bg-white/5" />
          
          {/* Comments */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="space-y-6"
          >
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Comments ({comments.length})
            </h2>
            
            {/* Add comment */}
            <div className="glass p-6 rounded-xl border border-white/10 space-y-4">
              <Textarea 
                placeholder={isAuthenticated 
                  ? "Add your thoughts to the discussion..." 
                  : "Sign in to join the discussion"
                }
                className="min-h-[100px] bg-white/5 border-white/10 focus:border-primary/50"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                disabled={!isAuthenticated || isSubmittingComment}
              />
              <div className="flex justify-end">
                <Button 
                  onClick={handleAddComment}
                  disabled={!isAuthenticated || !commentText.trim() || isSubmittingComment}
                  className="premium-button"
                >
                  {isSubmittingComment && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Comment
                </Button>
              </div>
            </div>
            
            {/* Comment list */}
            <motion.div 
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="space-y-4 mt-6"
            >
              {comments.length > 0 ? (
                comments.map((comment, index) => (
                  <motion.div
                    key={comment.id}
                    variants={fadeIn}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="modern-card overflow-hidden border-white/10">
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          <Avatar className="mt-1 ring-2 ring-white/10">
                            <AvatarImage src={comment.user.avatar_url} />
                            <AvatarFallback>{comment.user.username[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="font-medium flex items-center gap-1.5">
                                <User className="h-3.5 w-3.5 text-primary" />
                                {comment.user.username}
                              </div>
                              <div className="text-sm text-muted-foreground flex items-center">
                                <Clock className="h-3.5 w-3.5 mr-1.5" />
                                {formatDate(comment.created_at)}
                              </div>
                            </div>
                            <div className="text-sm">
                              {comment.content}
                            </div>
                            <div className="flex items-center gap-2 pt-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-white/10">
                                <Heart className="h-4 w-4 text-primary/80" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-white/10">
                                <Reply className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-white/10">
                                <Flag className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="glass text-center py-10 rounded-xl border border-white/10"
                >
                  <MessageSquare className="mx-auto h-10 w-10 mb-4 text-muted-foreground/50" />
                  <p className="font-medium text-lg">No comments yet</p>
                  <p className="text-sm mt-2 text-muted-foreground max-w-md mx-auto">
                    Be the first to share your thoughts and contribute to this discussion!
                  </p>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        </div>

        {/* Back to Discussions */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-10 flex justify-center"
        >
          <Button 
            onClick={() => router.push('/community')} 
            variant="outline" 
            className="glass hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Discussions
          </Button>
        </motion.div>
      </div>
    </div>
  )
} 