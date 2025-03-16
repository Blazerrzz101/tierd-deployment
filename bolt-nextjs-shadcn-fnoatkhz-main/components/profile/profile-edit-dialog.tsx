"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera } from "lucide-react"
import { toast } from "sonner"

const profileSchema = z.object({
  username: z.string().min(3).max(20),
  avatarUrl: z.string().url().optional(),
})

interface ProfileEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentUsername: string
  currentAvatarUrl?: string
  onUpdate: (data: z.infer<typeof profileSchema>) => void
}

export function ProfileEditDialog({
  open,
  onOpenChange,
  currentUsername,
  currentAvatarUrl,
  onUpdate,
}: ProfileEditDialogProps) {
  const [previewUrl, setPreviewUrl] = useState(currentAvatarUrl)

  const form = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: currentUsername,
      avatarUrl: currentAvatarUrl,
    },
  })

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB")
      return
    }

    // In a real app, you'd upload to a storage service
    // For now, create a local preview URL
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    form.setValue("avatarUrl", url)
  }

  const onSubmit = (values: z.infer<typeof profileSchema>) => {
    onUpdate(values)
    onOpenChange(false)
    toast.success("Profile updated successfully!")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={previewUrl} />
                  <AvatarFallback>{currentUsername[0]}</AvatarFallback>
                </Avatar>
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 cursor-pointer rounded-full bg-primary p-2 text-white hover:bg-primary/90"
                >
                  <Camera className="h-4 w-4" />
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Click the camera icon to upload a new profile picture
              </p>
            </div>

            {/* Username Field */}
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}