'use client'

import { useState, useRef, useEffect } from 'react'
import { MoreVertical, ArrowBigUp, MessageSquare, RefreshCw, Volume2, VolumeX, Play, Pause, Clock, User, AlertCircle, WifiOff, Ban } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { SubredditColumn, SortOption, TimeFilter } from '../types/subreddit'
import { sortPosts } from '../utils/subreddit'
import { getRelativeTime } from '../utils/dateUtils'
import Image from 'next/image'

interface SubredditColumnProps {
  column: SubredditColumn
  onDelete: () => void
  onRefresh: (sortBy: SortOption, timeFilter: TimeFilter) => void
  onSortChange: (sortBy: SortOption) => void
  onTimeFilterChange: (timeFilter: TimeFilter) => void
  isLoading?: boolean
  error?: string | null
}

export function SubredditColumn({ 
  column, 
  onDelete, 
  onRefresh, 
  onSortChange, 
  onTimeFilterChange,
  isLoading,
  error
}: SubredditColumnProps) {
  const lastRefreshed = new Date(column.lastRefreshed).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
  const [mutedVideos, setMutedVideos] = useState<{ [key: string]: boolean }>({})
  const [playingVideos, setPlayingVideos] = useState<{ [key: string]: boolean }>({})
  const [localSortBy, setLocalSortBy] = useState<'default' | 'ups' | 'num_comments'>('default')
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({})
  const [currentTime, setCurrentTime] = useState(Date.now())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now())
    }, 60000) // Update every minute

    return () => clearInterval(timer)
  }, [])

  const toggleMute = (postUrl: string) => {
    setMutedVideos(prev => ({ ...prev, [postUrl]: !prev[postUrl] }))
  }

  const togglePlay = (postUrl: string) => {
    const video = videoRefs.current[postUrl]
    if (video) {
      if (video.paused) {
        video.play()
      } else {
        video.pause()
      }
      setPlayingVideos(prev => ({ ...prev, [postUrl]: !video.paused }))
    }
  }

  const displayPosts = localSortBy === 'default' 
    ? column.posts 
    : sortPosts(column.posts, localSortBy)

  const renderErrorMessage = () => {
    if (!error) return null;

    let icon = <AlertCircle className="h-4 w-4" />;
    const title = "Error";
    const description = error;

    if (error.includes("network")) {
      icon = <WifiOff className="h-4 w-4" />;
    } else if (error.includes("not found") || error.includes("404")) {
      icon = <Ban className="h-4 w-4" />;
    }

    return (
      <Alert key="error-message" variant="destructive" className="mb-4">
        {icon}
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{description}</AlertDescription>
      </Alert>
    );
  };

  return (
    <div className="flex flex-col w-[75vw] flex-shrink-0 bg-gray-50 rounded-lg shadow-md h-[calc(100vh-12rem)] overflow-hidden max-w-[400px]">
      <div className="flex items-center justify-between p-3 bg-white border-b">
        <a
          href={`https://reddit.com/r/${column.name}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-lg font-semibold text-orange-500 hover:text-orange-600"
        >
          r/{column.name}
        </a>
        <div className="flex items-center space-x-2">
          <Select value={column.sortBy} onValueChange={(value: SortOption) => onSortChange(value)}>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem key="hot" value="hot">Hot</SelectItem>
              <SelectItem key="new" value="new">New</SelectItem>
              <SelectItem key="top" value="top">Top</SelectItem>
              <SelectItem key="rising" value="rising">Rising</SelectItem>
            </SelectContent>
          </Select>
          {column.sortBy === 'top' && (
            <Select value={column.timeFilter} onValueChange={(value: TimeFilter) => onTimeFilterChange(value)}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Time filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="hour" value="hour">Hour</SelectItem>
                <SelectItem key="day" value="day">Day</SelectItem>
                <SelectItem key="week" value="week">Week</SelectItem>
                <SelectItem key="month" value="month">Month</SelectItem>
                <SelectItem key="year" value="year">Year</SelectItem>
                <SelectItem key="all" value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          )}
          <Button variant="ghost" size="sm" onClick={() => onRefresh(column.sortBy, column.timeFilter)}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Sort Posts</DropdownMenuLabel>
              <DropdownMenuItem key="default" onClick={() => setLocalSortBy('default')}>
                Default Order {localSortBy === 'default' && '✓'}
              </DropdownMenuItem>
              <DropdownMenuItem key="ups" onClick={() => setLocalSortBy('ups')}>
                Most Upvoted {localSortBy === 'ups' && '✓'}
              </DropdownMenuItem>
              <DropdownMenuItem key="comments" onClick={() => setLocalSortBy('num_comments')}>
                Most Comments {localSortBy === 'num_comments' && '✓'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem key="delete" onClick={onDelete} className="text-red-600">
                Delete Column
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="flex items-center gap-1 p-2 text-xs text-gray-500 bg-white border-b">
        <Clock className="w-3 h-3" />
        <span>Last refreshed: {lastRefreshed}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-2 subreddit-column-scroll">
        {renderErrorMessage()}
        {isLoading ? (
          <div className="flex items-center justify-center h-24">
            <RefreshCw className="w-6 h-6 animate-spin text-orange-500" />
          </div>
        ) : (
          <div key="posts-container" className="space-y-4">
            {displayPosts.map((post, index) => (
              <div key={`${post.id}-${index}`} className="bg-white rounded-md shadow-sm hover:shadow-md transition-shadow">
                {post.videoUrl ? (
                  <div className="relative">
                    <video
                      ref={el => videoRefs.current[post.id] = el}
                      src={post.videoUrl}
                      controls={false}
                      muted={!mutedVideos[post.id]}
                      className="w-full rounded-t-md"
                      onClick={() => togglePlay(post.id)}
                    >
                      Your browser does not support the video tag.
                    </video>
                    <div className="absolute bottom-2 right-2 flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="bg-black/50 hover:bg-black/70 text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleMute(post.id);
                        }}
                      >
                        {mutedVideos[post.id] ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="bg-black/50 hover:bg-black/70 text-white"
                        onClick={() => togglePlay(post.id)}
                      >
                        {playingVideos[post.id] ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                ) : post.gifUrl ? (
                  <div className="relative w-full aspect-video">
                    <Image
                      src={post.gifUrl}
                      alt={post.title}
                      fill
                      className="rounded-t-md object-cover"
                    />
                  </div>
                ) : post.preview?.images[0]?.source.url ? (
                  <div className="relative w-full h-48">
                    <Image
                      src={post.preview.images[0].source.url.replace(/&amp;/g, '&')}
                      alt={post.title}
                      fill
                      className="object-cover rounded-t-md"
                    />
                  </div>
                ) : null}
                <div className="p-4">
                  <a
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <h3 className="font-medium text-gray-900 hover:text-orange-500 transition-colors mb-2">
                      {post.title}
                    </h3>
                  </a>
                  {post.selftext && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-3">{post.selftext}</p>
                  )}
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-500">
                      <User className="w-4 h-4 mr-1 text-orange-500" />
                      <span className="font-medium text-orange-500 break-all">u/{post.author}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <div className="flex items-center text-gray-500">
                        <Clock className="w-4 h-4 mr-1 text-orange-500" />
                        <span>{getRelativeTime(post.created, currentTime)}</span>
                      </div>
                      <div className="flex items-center text-gray-500">
                        <ArrowBigUp className="w-4 h-4 mr-1 text-orange-500" />
                        <span>{post.ups}</span>
                      </div>
                      <div className="flex items-center text-gray-500">
                        <MessageSquare className="w-4 h-4 mr-1 text-orange-500" />
                        <span>{post.num_comments}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

