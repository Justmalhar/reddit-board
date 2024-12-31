'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface AddSubredditProps {
  onAdd: (subreddit: string) => Promise<boolean>
  error: string | null
}

export function AddSubreddit({ onAdd, error }: AddSubredditProps) {
  const [input, setInput] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (error) {
      setLocalError(error)
    }
  }, [error])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) {
      setLocalError('Please enter a subreddit name')
      return
    }

    setIsLoading(true)
    setLocalError(null)

    try {
      const cleanInput = input.trim().toLowerCase()
      if (!/^[a-zA-Z0-9_]+$/.test(cleanInput)) {
        setLocalError('Invalid subreddit name')
        return
      }

      const success = await onAdd(cleanInput)
      if (success) {
        setInput('')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add subreddit'
      setLocalError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="bg-orange-500 hover:bg-orange-600 text-white">Add Subreddit</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Subreddit</DialogTitle>
          <DialogDescription>
            Enter a subreddit URL, r/subreddit, or just the subreddit name.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter subreddit"
              disabled={isLoading}
            />
            {localError && (
              <Alert variant="destructive">
                <AlertDescription>
                  {localError}
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              className="bg-orange-500 hover:bg-orange-600 text-white"
              disabled={isLoading}
            >
              {isLoading ? 'Adding...' : 'Add Subreddit'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

