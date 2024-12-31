import type { RedditPost, SubredditData, SortOption, TimeFilter } from '../types/subreddit'

const TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

export function parseSubredditInput(input: string): string {
  input = input.trim().toLowerCase()
  
  if (input.startsWith('http')) {
    const matches = input.match(/reddit\.com\/r\/([^/]+)/)
    return matches ? matches[1] : ''
  }
  
  return input.startsWith('r/') ? input.slice(2) : input
}

export async function fetchSubredditFeed(
  subreddit: string, 
  sortBy: SortOption = 'hot', 
  timeFilter: TimeFilter = 'day'
): Promise<{ posts: RedditPost[], logs: string[] }> {
  const logs: string[] = []
  
  try {
    logs.push(`Fetching ${sortBy} posts for r/${subreddit}`)
    let url = `https://www.reddit.com/r/${subreddit}/${sortBy}.json?limit=50`
    if (sortBy === 'top') {
      url += `&t=${timeFilter}`
    }
    logs.push(`URL: ${url}`)
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RedditBoard/1.0; +http://example.com/bot)',
      },
    })
    
    logs.push(`Response status: ${response.status}`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    logs.push(`Response received. Parsing JSON data.`)
    
    if (!data.data || !Array.isArray(data.data.children)) {
      throw new Error('Invalid response format')
    }
    
    const posts: RedditPost[] = data.data.children.map((child: any) => {
      const post = child.data;
      let videoUrl = null;
      let gifUrl = null;

      if (post.is_video && post.media?.reddit_video) {
        videoUrl = post.media.reddit_video.fallback_url;
      } else if (post.post_hint === 'hosted:video' && post.preview?.reddit_video_preview) {
        videoUrl = post.preview.reddit_video_preview.fallback_url;
      }

      if (post.preview?.images[0]?.variants?.gif) {
        gifUrl = post.preview.images[0].variants.gif.source.url;
      }

      return {
        title: post.title || '',
        url: post.url || `https://www.reddit.com${post.permalink}`,
        author: post.author || '',
        created: post.created_utc * 1000 || Date.now(),
        selftext: post.selftext || '',
        ups: post.ups || 0,
        num_comments: post.num_comments || 0,
        thumbnail: post.thumbnail,
        preview: post.preview,
        is_video: post.is_video || false,
        media: post.media,
        videoUrl: videoUrl,
        gifUrl: gifUrl
      };
    })

    logs.push(`Processed ${posts.length} posts`)
    return { posts, logs }
  } catch (error) {
    logs.push(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    console.error('Error fetching subreddit:', error)
    throw { error, logs }
  }
}

export function saveSubredditData(name: string, data: SubredditData): void {
  const storageData = {
    ...data,
    lastRefreshed: Date.now(),
  }
  localStorage.setItem(`redditboard_${name}`, JSON.stringify(storageData))
}

export function getSubredditData(name: string): SubredditData | null {
  const data = localStorage.getItem(`redditboard_${name}`)
  if (!data) return null

  const parsedData: SubredditData = JSON.parse(data)
  const now = Date.now()

  if (now - parsedData.lastRefreshed > TTL) {
    return null
  }

  return parsedData
}

export function sortPosts(posts: RedditPost[], sortBy: 'ups' | 'num_comments'): RedditPost[] {
  return [...posts].sort((a, b) => b[sortBy] - a[sortBy])
}

