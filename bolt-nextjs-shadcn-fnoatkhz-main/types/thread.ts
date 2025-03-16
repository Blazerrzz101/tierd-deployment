export interface Thread {
  id: string
  title: string
  content: string
  category: string
  author: {
    name: string
    image?: string
  }
  upvotes: number
  commentCount: number
  createdAt: string
}