import { Errors } from '../errors'

export const getPlaylistItemsYoutubeIds = async (
  sql: Bun.SQL,
  selectedIds: string[],
  playlistId: string,
  userId: string
) => {
  const ids = await sql<
    {
      id: string
      youtube_id: string
      video_youtube_id: string
    }[]
  >`
    SELECT pi.id, pi.youtube_id, pi.video_youtube_id
    FROM playlist_items pi
    JOIN playlists pl ON pl.id = pi.playlist_id
    WHERE pi.id = ANY(${sql.array(selectedIds, 'TEXT')}::uuid[])
      AND pi.playlist_id = ${playlistId}
      AND pl.user_id = ${userId}
  `
  if (!ids.length) throw Errors.notFound('Selected IDs not found')
  return ids
}
