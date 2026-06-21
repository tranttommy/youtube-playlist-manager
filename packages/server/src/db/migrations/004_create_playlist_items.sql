CREATE TABLE channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  youtube_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL
);

CREATE TABLE playlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  youtube_id TEXT NOT NULL UNIQUE,
  video_youtube_id TEXT NOT NULL,
  playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES channels(id),
  title TEXT NOT NULL,
  thumbnail TEXT,
  published_at TIMESTAMPTZ,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_playlist_items_playlist_id ON playlist_items(playlist_id);
CREATE INDEX idx_playlist_items_channel_id ON playlist_items(channel_id);
