"use client"

import { useState } from "react"
import { CommunityThreads } from "./threads"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { CreateThreadDialog } from "./create-thread-dialog"

interface GameThreadsProps {
  gameId: string
}

export function GameThreads({ gameId }: GameThreadsProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h3 className="text-lg font-semibold">Discussions</h3>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Thread
        </Button>
      </div>

      <CommunityThreads />

      <CreateThreadDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />
    </div>
  )
}