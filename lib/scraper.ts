import { Product } from "@/types"

interface ScrapedProduct {
  name: string
  description: string
  price: number
  imageUrl: string
  category: string
  specs: Record<string, string>
}

export async function scrapeProduct(url: string): Promise<ScrapedProduct | null> {
  try {
    const response = await fetch(url)
    const html = await response.text()

    // Use a DOM parser to extract product information
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')

    // Extract product details (this is a simplified example)
    const product: ScrapedProduct = {
      name: doc.querySelector('h1')?.textContent || '',
      description: doc.querySelector('meta[name="description"]')?.getAttribute('content') || '',
      price: parseFloat(doc.querySelector('.price')?.textContent?.replace(/[^0-9.]/g, '') || '0'),
      imageUrl: doc.querySelector('meta[property="og:image"]')?.getAttribute('content') || '',
      category: doc.querySelector('.category')?.textContent || '',
      specs: {},
    }

    return product
  } catch (error) {
    console.error('Error scraping product:', error)
    return null
  }
}

export async function scrapeProductList(urls: string[]): Promise<ScrapedProduct[]> {
  const products = await Promise.all(
    urls.map(url => scrapeProduct(url))
  )
  return products.filter((p): p is ScrapedProduct => p !== null)
}

export function normalizeProduct(scrapedProduct: ScrapedProduct): Partial<Product> {
  return {
    name: scrapedProduct.name,
    description: scrapedProduct.description,
    price: scrapedProduct.price,
    imageUrl: scrapedProduct.imageUrl,
    category: scrapedProduct.category,
    votes: 0,
    rank: 0,
  }
}