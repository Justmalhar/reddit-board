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
import { parseSubredditInput } from '../utils/subreddit'

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
    const subreddit = parseSubredditInput(input)
    
    if (!subreddit) {
      setLocalError('Invalid subreddit format')
      return
    }

    setLocalError(null)
    setIsLoading(true)

    try {
      const success = await onAdd(subreddit)
      if (success) {
        setInput('')
        setIsOpen(false)
      }
    } catch (err) {
      setLocalError(err.message || 'Failed to add subreddit')
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

