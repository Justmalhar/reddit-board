'use client'

import { useEffect, useState } from 'react'
import { AddSubreddit } from '@/components/add-subreddit'
import { SubredditColumn } from '@/components/subreddit-column'
import { fetchSubredditFeed, saveSubredditData, getSubredditData } from '@/utils/subreddit'
import type { SubredditColumn as SubredditColumnType, SortOption, TimeFilter } from '@/types/subreddit'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

const STORAGE_KEY = 'reddit-board-subreddits'

export default function RedditBoard() {
  const [columns, setColumns] = useState<SubredditColumnType[]>([])
  const [loadingColumns, setLoadingColumns] = useState<{ [key: string]: boolean }>({})
  const [errorColumns, setErrorColumns] = useState<{ [key: string]: string | null }>({})
  const [error, setError] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])

  useEffect(() => {
    const loadSavedSubreddits = async () => {
      const initialLoadingState: { [key: string]: boolean } = {}
      const initialErrorState: { [key: string]: string | null } = {}
      setError(null)
      setLogs([])
      
      try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
          const subreddits = JSON.parse(saved)
          subreddits.forEach((name: string) => {
            initialLoadingState[name] = true
            initialErrorState[name] = null
          })
          setLoadingColumns(initialLoadingState)
          setErrorColumns(initialErrorState)
          
          const loadedColumns = await Promise.all(
            subreddits.map(async (name: string) => {
              try {
                const cachedData = getSubredditData(name)
                if (cachedData) {
                  return {
                    name,
                    url: `https://reddit.com/r/${name}`,
                    ...cachedData
                  }
                }

                const { posts, logs: subLogs } = await fetchSubredditFeed(name)
                setLogs(prev => [...prev, ...subLogs])
                const newData = {
                  name,
                  url: `https://reddit.com/r/${name}`,
                  posts,
                  lastRefreshed: Date.now(),
                  sortBy: 'hot' as SortOption,
                  timeFilter: 'day' as TimeFilter
                }
                saveSubredditData(name, newData)
                return newData
              } catch (err) {
                if (err.logs) {
                  setLogs(prev => [...prev, ...err.logs])
                }
                console.error(`Failed to load r/${name}:`, err)
                setErrorColumns(prev => ({ ...prev, [name]: err.message || 'Failed to load subreddit' }))
                return null
              } finally {
                setLoadingColumns(prev => ({ ...prev, [name]: false }))
              }
            })
          )
          setColumns(loadedColumns.filter(Boolean) as SubredditColumnType[])
        }
      } catch (err) {
        setError('Failed to load saved subreddits')
        console.error(err)
      } finally {
        setLoadingColumns({})
      }
    }

    loadSavedSubreddits()
  }, [])

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(columns.map(col => col.name))
    )
  }, [columns])

  const handleAddSubreddit = async (input: string): Promise<boolean> => {
    if (columns.some(col => col.name === input)) {
      setError('This subreddit is already added')
      return false
    }

    setLoadingColumns(prev => ({ ...prev, [input]: true }))
    setError(null)
    setLogs([])

    try {
      const { posts, logs: subLogs } = await fetchSubredditFeed(input)
      setLogs(subLogs)
      const newColumn = {
        name: input,
        url: `https://reddit.com/r/${input}`,
        posts,
        lastRefreshed: Date.now(),
        sortBy: 'hot' as SortOption,
        timeFilter: 'day' as TimeFilter
      }
      setColumns(prev => [...prev, newColumn])
      saveSubredditData(input, newColumn)
      setErrorColumns(prev => ({ ...prev, [input]: null }))
      return true
    } catch (err) {
      if (err.logs) {
        setLogs(err.logs)
      }
      let errorMessage = `Failed to load r/${input}: `
      if (err.error instanceof Error) {
        errorMessage += err.error.message
      } else {
        errorMessage += 'Unknown error occurred.'
      }
      setError(errorMessage)
      setErrorColumns(prev => ({ ...prev, [input]: errorMessage }))
      return false
    } finally {
      setLoadingColumns(prev => ({ ...prev, [input]: false }))
    }
  }

  const handleDeleteColumn = (index: number) => {
    const columnToDelete = columns[index]
    setColumns(prev => prev.filter((_, i) => i !== index))
    localStorage.removeItem(`redditboard_${columnToDelete.name}`)
    setErrorColumns(prev => {
      const newErrorColumns = { ...prev }
      delete newErrorColumns[columnToDelete.name]
      return newErrorColumns
    })
  }

  const handleRefreshColumn = async (index: number, sortBy: SortOption, timeFilter: TimeFilter) => {
    const columnToRefresh = columns[index]
    setLoadingColumns(prev => ({ ...prev, [columnToRefresh.name]: true }))
    setError(null)
    setLogs([])

    try {
      const { posts, logs: subLogs } = await fetchSubredditFeed(columnToRefresh.name, sortBy, timeFilter)
      setLogs(subLogs)
      const updatedColumn = {
        ...columnToRefresh,
        posts,
        lastRefreshed: Date.now(),
        sortBy,
        timeFilter
      }
      setColumns(prev => prev.map((col, i) => i === index ? updatedColumn : col))
      saveSubredditData(columnToRefresh.name, updatedColumn)
      setErrorColumns(prev => ({ ...prev, [columnToRefresh.name]: null }))
    } catch (err) {
      if (err.logs) {
        setLogs(err.logs)
      }
      let errorMessage = `Failed to refresh r/${columnToRefresh.name}: `
      if (err.error instanceof Error) {
        errorMessage += err.error.message
      } else {
        errorMessage += 'Unknown error occurred.'
      }
      setError(errorMessage)
      setErrorColumns(prev => ({ ...prev, [columnToRefresh.name]: errorMessage }))
    } finally {
      setLoadingColumns(prev => ({ ...prev, [columnToRefresh.name]: false }))
    }
  }

  const handleSortChange = async (index: number, sortBy: SortOption) => {
    const column = columns[index]
    await handleRefreshColumn(index, sortBy, column.timeFilter)
  }

  const handleTimeFilterChange = async (index: number, timeFilter: TimeFilter) => {
    const column = columns[index]
    await handleRefreshColumn(index, column.sortBy, timeFilter)
  }

  return (
    <div className="flex flex-col h-screen bg-orange-100/50">
      <header className="sticky top-0 z-20 bg-white shadow-md p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img 
            src="https://img.icons8.com/?size=100&id=5RTQxy0E0NUY&format=png&color=000000" 
            alt="Reddit Logo" 
            className="w-8 h-8"
          />
          <h1 className="text-2xl font-bold text-orange-600">RedditBoard</h1>
        </div>
        <AddSubreddit onAdd={handleAddSubreddit} error={error} />
      </header>
      {error && (
        <Alert variant="destructive" className="m-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="flex-1 p-4">
        <div className="flex gap-4 pb-4 overflow-x-auto subreddit-columns">
          {columns.map((column, index) => (
            <SubredditColumn
              key={column.name}
              column={column}
              onDelete={() => handleDeleteColumn(index)}
              onRefresh={(sortBy, timeFilter) => handleRefreshColumn(index, sortBy, timeFilter)}
              onSortChange={(sortBy) => handleSortChange(index, sortBy)}
              onTimeFilterChange={(timeFilter) => handleTimeFilterChange(index, timeFilter)}
              isLoading={loadingColumns[column.name]}
              error={errorColumns[column.name]}
            />
          ))}
        </div>
      </div>
      <footer className="p-4 text-center text-sm text-gray-600 bg-white/80 backdrop-blur-sm">
        Made with ❤️ and AI by{' '}
        <a 
          href="https://x.com/justmalhar" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-orange-500 hover:text-orange-600"
        >
          @justmalhar
        </a>
      </footer>
    </div>
  )
}

