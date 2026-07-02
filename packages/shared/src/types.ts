export interface UserProfile {
  id: string
  email: string
  name: string
  picture: string | null
}

export interface Playlist {
  id: string
  title: string
  thumbnail: string | null
  item_count: number
  published_at: string
}

export interface PlaylistItem {
  id: string
  title: string
  thumbnail: string | null
  channel_title: string | null
  channel_id: string | null
}
