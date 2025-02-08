"use client"

import { cn } from "@/lib/utils"

interface PasswordStrengthProps {
  password: string
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const getStrength = (password: string) => {
    let score = 0
    if (!password) return score

    // Award points for length
    if (password.length >= 8) score++
    if (password.length >= 12) score++

    // Award points for complexity
    if (/[A-Z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++

    return score
  }

  const strength = getStrength(password)

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-2 w-full rounded-full",
              i < strength ? "bg-primary" : "bg-muted"
            )}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        {strength === 0 && "Add a password"}
        {strength === 1 && "Too weak"}
        {strength === 2 && "Could be stronger"}
        {strength === 3 && "Getting better"}
        {strength === 4 && "Strong password"}
        {strength === 5 && "Very strong password"}
      </p>
    </div>
  )
}