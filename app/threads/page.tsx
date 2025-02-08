import { Metadata } from 'next'
import { ThreadCreator } from '@/components/threads/thread-creator'
import { ThreadList } from '@/components/threads/thread-list'

export const metadata: Metadata = {
  title: 'Threads | TechRate',
  description: 'Join discussions about tech products and share your thoughts',
}

export default function ThreadsPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-3xl mx-auto -mt-32 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-blue-600 to-blue-800">
            What do you want to know?
          </h1>
          <p className="text-muted-foreground">
            Ask questions, share experiences, or discuss any tech product with the community
          </p>
        </div>
        <ThreadCreator />
        <ThreadList />
      </div>
    </main>
  )
} 