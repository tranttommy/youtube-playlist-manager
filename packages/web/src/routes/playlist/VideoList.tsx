import type { PlaylistItem } from '@ypm/shared'
import VideoRow from './VideoRow'

export default function VideoList({ videos }: { videos: PlaylistItem[] }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-6">
        <h2 className="text-lg font-display font-semibold text-text-primary tracking-tight">
          Videos
        </h2>
        <span className="text-xs text-text-muted">
          {videos.length} {videos.length === 1 ? 'video' : 'videos'}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {videos.map(video => (
          <VideoRow key={video.id} video={video} />
        ))}
      </div>
    </div>
  )
}
