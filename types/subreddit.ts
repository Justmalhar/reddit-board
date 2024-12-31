export interface RedditPost {
  id: string
  title: string
  url: string
  author: string
  created: number
  selftext?: string
  ups: number
  num_comments: number
  thumbnail: string
  preview?: {
    images: Array<{
      source: {
        url: string
        width: number
        height: number
      }
      variants?: {
        gif?: {
          source: {
            url: string
            width: number
            height: number
          }
        }
        mp4?: {
          source: {
            url: string
            width: number
            height: number
          }
        }
      }
    }>
  }
  is_video: boolean
  media?: {
    reddit_video?: {
      fallback_url: string
      height: number
      width: number
    }
  }
  videoUrl: string | null
  gifUrl: string | null
}

export interface SubredditColumn {
  name: string
  url: string
  posts: RedditPost[]
  lastRefreshed: number
  sortBy: SortOption
  timeFilter: TimeFilter
}

export interface SubredditData {
  posts: RedditPost[]
  lastRefreshed: number
  sortBy: SortOption
  timeFilter: TimeFilter
}

export type SortOption = 'hot' | 'new' | 'top' | 'rising'
export type TimeFilter = 'hour' | 'day' | 'week' | 'month' | 'year' | 'all'

