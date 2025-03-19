"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Product } from "@/utils/product-utils"
import { getProductByIdOrSlug, getValidProductSlug, findProductBySlug, isValidProductSlug, createProductUrl } from "@/utils/product-utils"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, AlertTriangle } from "lucide-react"
import ProductDetail from "@/components/products/product-detail"

interface ProductPageProps {
  params: {
    slug: string
  }
}

export default function ProductPage({ params }: ProductPageProps) {
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [validSlug, setValidSlug] = useState<string | null>(null)
  const [invalidSlugDetected, setInvalidSlugDetected] = useState(false)

  // Debug: Log the incoming slug parameter
  useEffect(() => {
    console.log("Product page mounted with slug:", params.slug);
    
    // Check if the slug is valid
    if (!isValidProductSlug(params.slug)) {
      console.error(`Invalid slug detected: ${params.slug}`);
      setInvalidSlugDetected(true);
      
      // Try to find a product that might match despite the invalid slug
      const possibleProduct = findProductBySlug(params.slug);
      if (possibleProduct) {
        // We found a product that matches, get its valid slug
        const validProductSlug = getValidProductSlug(possibleProduct);
        console.log(`Found matching product with valid slug: ${validProductSlug}`);
        setValidSlug(validProductSlug);
        
        // Redirect to the correct URL after a short delay
        setTimeout(() => {
          router.replace(createProductUrl(possibleProduct));
        }, 100);
      } else {
        setError("Invalid product URL. This product could not be found.");
        setIsLoading(false);
      }
      return;
    }
    
    // Fetch product data
    async function fetchProduct() {
      try {
        setIsLoading(true);
        
        // First try to find the product in our local data
        const foundProduct = findProductBySlug(params.slug);
        if (foundProduct) {
          setProduct(foundProduct);
          setIsLoading(false);
          return;
        }
        
        // If not found locally, try the API
        const result = await getProductByIdOrSlug(params.slug);
        
        if (result) {
          setProduct(result);
        } else {
          setError("Product not found. It may have been removed or the URL is incorrect.");
        }
      } catch (err) {
        console.error("Error loading product:", err);
        setError("Error loading product data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchProduct();
  }, [params.slug, router]);

  // Render appropriate content based on state
  if (invalidSlugDetected && validSlug) {
    return (
      <div className="container py-8">
        <Alert className="mb-6 bg-yellow-50 border-yellow-200">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertTitle>Redirecting to correct product page</AlertTitle>
          <AlertDescription>
            The URL contains an invalid product identifier. You're being redirected to the correct page.
          </AlertDescription>
        </Alert>
        <div className="flex justify-center">
          <Skeleton className="h-96 w-full max-w-3xl rounded-lg" />
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container py-8">
        <Skeleton className="h-12 w-64 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Skeleton className="h-96 rounded-lg col-span-2" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container py-8">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="text-xl font-medium">Product Not Found</CardTitle>
            <CardDescription>
              {error || "This product could not be found or no longer exists."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              The product you're looking for might:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>Have been removed or renamed</li>
              <li>Have a URL that has changed</li>
              <li>Be temporarily unavailable</li>
            </ul>
            <div className="pt-4 flex gap-4">
              <Button onClick={() => router.push('/products')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Browse All Products
              </Button>
              <Button variant="outline" onClick={() => router.back()}>
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Normal render of product
  return <ProductDetail product={product} />;
} 