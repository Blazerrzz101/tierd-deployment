"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2, Tag as TagIcon, AlertTriangle } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { useEnhancedAuth } from "@/hooks/enhanced-auth"
import { threadStore } from "@/lib/local-storage/thread-store"
import { categories } from "@/lib/data"
import { Badge } from "@/components/ui/badge"
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { products } from "@/lib/data"
import { Product } from "@/types"
import { Thread } from "@/types/thread"
import { censorProfanity, containsProfanity } from "@/lib/utils/profanity-filter"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Generate a unique ID for new threads
const generateUniqueId = () => `thread_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

// Custom thread type for community discussions
interface ExtendedThread {
  id: string;
  title: string;
  content: string;
  category: string;
  author: {
    id: string;
    name: string;
    avatar_url: string;
  };
  created_at: string;
  upvotes: number;
  downvotes: number;
  comments: any[];
  taggedProducts: Product[];
}

const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title cannot exceed 100 characters"),
  content: z.string().min(10, "Content must be at least 10 characters").max(2000, "Content cannot exceed 2000 characters"),
  category: z.string().min(1, "Please select a category"),
})

interface CreateThreadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onThreadCreated?: (thread: ExtendedThread) => void
}

export function CreateThreadDialog({ 
  open, 
  onOpenChange,
  onThreadCreated = () => {}
}: CreateThreadDialogProps) {
  const { user, isAuthenticated, isLoading } = useEnhancedAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isCreating, setIsCreating] = React.useState(false)
  const [selectedProducts, setSelectedProducts] = React.useState<Product[]>([])
  const [showProductSearch, setShowProductSearch] = React.useState(false)
  const [productSearch, setProductSearch] = React.useState("")
  const [hasProfanity, setHasProfanity] = React.useState(false)
  const [autoFilterEnabled, setAutoFilterEnabled] = React.useState(true)
  
  // Filtered products based on search
  const filteredProducts = productSearch.trim()
    ? products
        .filter(product => 
          product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
          product.description?.toLowerCase().includes(productSearch.toLowerCase())
        )
        .slice(0, 6)
    : []

  // Debug logging
  React.useEffect(() => {
    console.log("CreateThreadDialog auth state:", { 
      isAuthenticated, 
      isLoading, 
      userId: user?.id 
    });
  }, [isAuthenticated, isLoading, user]);

  // Form definition with zod schema
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      content: "",
      category: "general",
    },
  })

  // Handle authentication redirect
  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log("User not authenticated, redirecting to sign-in");
      toast({
        title: "Authentication required",
        description: "Please sign in to create a thread",
        variant: "destructive",
      });
      
      // Close dialog and redirect to sign-in
      onOpenChange(false);
      router.push("/sign-in");
    }
  }, [isAuthenticated, isLoading, onOpenChange, router, toast]);

  // Form submission handler
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // Double-check authentication
    if (!isAuthenticated || !user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create a thread",
        variant: "destructive",
      });
      onOpenChange(false);
      router.push("/sign-in");
      return;
    }

    // Check for profanity
    const titleHasProfanity = containsProfanity(values.title);
    const contentHasProfanity = containsProfanity(values.content);
    
    // If profanity is detected, handle according to settings
    if ((titleHasProfanity || contentHasProfanity) && !autoFilterEnabled) {
      setHasProfanity(true);
      toast({
        title: "Profanity detected",
        description: "Please remove inappropriate language before posting",
        variant: "destructive",
      });
      return;
    }
    
    // Auto-filter profanity if enabled
    if (autoFilterEnabled) {
      values.title = censorProfanity(values.title);
      values.content = censorProfanity(values.content);
    }

    setIsCreating(true);
    try {
      console.log("Creating thread with values:", values);
      
      // Create the thread object
      const newThread: ExtendedThread = {
        id: generateUniqueId(),
        title: values.title,
        content: values.content,
        category: values.category,
        author: {
          id: user.id,
          name: user.name,
          avatar_url: user.avatar_url || '/placeholders/user.svg',
        },
        created_at: new Date().toISOString(),
        upvotes: 0,
        downvotes: 0,
        comments: [],
        taggedProducts: selectedProducts
      };

      console.log("New thread created:", newThread);
      
      // Call callback with the new thread
      onThreadCreated(newThread);
      
      // Store the thread locally
      threadStore.addThread(newThread);
      
      // Show success message
      toast({
        title: "Thread created",
        description: autoFilterEnabled && (titleHasProfanity || contentHasProfanity) 
          ? "Your thread has been created with some content filtered to maintain community standards" 
          : "Your thread has been created successfully",
      });
      
      // Close the dialog
      onOpenChange(false);
      
      // Reset the form
      form.reset();
      setSelectedProducts([]);
      setHasProfanity(false);
    } catch (error) {
      console.error("Error creating thread:", error);
      toast({
        title: "Failed to create thread",
        description: "An error occurred while creating your thread",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Handle product selection
  const handleSelectProduct = (product: Product) => {
    setSelectedProducts(prev => {
      // Check if product is already selected
      if (prev.some(p => p.id === product.id)) {
        return prev;
      }
      return [...prev, product];
    });
    setShowProductSearch(false);
  };

  // Remove product from selection
  const removeProduct = (productId: string) => {
    setSelectedProducts(prev => prev.filter(p => p.id !== productId));
  };

  // Watch form values for profanity check
  const title = form.watch("title");
  const content = form.watch("content");
  
  // Check for profanity in real-time
  React.useEffect(() => {
    if (title || content) {
      const hasTitle = containsProfanity(title);
      const hasContent = containsProfanity(content);
      setHasProfanity(hasTitle || hasContent);
    } else {
      setHasProfanity(false);
    }
  }, [title, content]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Discussion</DialogTitle>
          <DialogDescription>
            Share your thoughts, questions, or recommendations with the community.
          </DialogDescription>
        </DialogHeader>
        
        {/* Profanity warning */}
        {hasProfanity && (
          <Alert variant="warning" className="mt-2 bg-amber-50 border-amber-300 text-amber-800 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-300">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between w-full">
              <span>Potential inappropriate language detected</span>
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-4 h-7 bg-amber-200/50 border-amber-300 hover:bg-amber-300/50 dark:bg-amber-800/30 dark:border-amber-700"
                onClick={() => {
                  form.setValue("title", censorProfanity(title));
                  form.setValue("content", censorProfanity(content));
                  setHasProfanity(false);
                }}
              >
                Auto-Filter
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Give your discussion a clear title" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Share your thoughts, questions, or experiences..."
                      className="min-h-[150px] resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Product tagging section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <FormLabel className="text-sm font-medium">Tagged Products</FormLabel>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowProductSearch(true)}
                >
                  <TagIcon className="h-3.5 w-3.5 mr-2" />
                  Tag Products
                </Button>
              </div>
              
              {selectedProducts.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedProducts.map(product => (
                    <Badge key={product.id} variant="secondary" className="flex items-center gap-1">
                      <span>{product.name}</span>
                      <button 
                        type="button"
                        className="ml-1 rounded-full hover:bg-muted p-0.5"
                        onClick={() => removeProduct(product.id)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 6 6 18"/>
                          <path d="m6 6 12 12"/>
                        </svg>
                      </button>
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Tag products to make your discussion more discoverable
                </p>
              )}
            </div>
            
            {/* Add profanity filter toggle */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium cursor-pointer flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={autoFilterEnabled}
                  onChange={(e) => setAutoFilterEnabled(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span>Automatically filter inappropriate language</span>
              </label>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Post Discussion
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
      
      {/* Product search dialog */}
      <CommandDialog open={showProductSearch} onOpenChange={setShowProductSearch}>
        <CommandInput 
          placeholder="Search for products to tag..." 
          value={productSearch}
          onValueChange={setProductSearch}
        />
        <CommandList>
          <CommandEmpty>No products found. Try a different search term.</CommandEmpty>
          <CommandGroup heading="Products">
            {filteredProducts.map(product => (
              <CommandItem
                key={product.id}
                value={product.name}
                onSelect={() => handleSelectProduct(product)}
              >
                <TagIcon className="mr-2 h-4 w-4" />
                <span>{product.name}</span>
                <span className="ml-2 text-xs text-muted-foreground">{product.category}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </Dialog>
  )
} 