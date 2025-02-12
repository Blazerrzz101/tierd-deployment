"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { signInWithEmail } from '@/lib/auth/supabase-auth'
import { toast } from 'sonner'

export function SignInForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await signInWithEmail(email, password)
      toast.success('Successfully signed in!')
      router.push('/') // Redirect to home page after successful sign in
      router.refresh() // Refresh the page to update auth state
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign in')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full bg-black/50 border-white/10 focus:border-[#ff4b26]/50"
        />
      </div>
      <div className="space-y-2">
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full bg-black/50 border-white/10 focus:border-[#ff4b26]/50"
        />
      </div>
      <Button
        type="submit"
        disabled={isLoading}
        className="w-full bg-[#ff4b26] hover:bg-[#ff4b26]/90 text-white"
      >
        {isLoading ? 'Signing in...' : 'Sign In'}
      </Button>
    </form>
  )
} 