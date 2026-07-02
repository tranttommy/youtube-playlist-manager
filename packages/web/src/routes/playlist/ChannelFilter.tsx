import type { PlaylistItem } from '@ypm/shared'
import { useMemo } from 'react'
import { NO_CHANNEL } from '../../lib/constants'

type Channel = { id: string; count: number; title: string }

export default function ChannelFilter({
  videos,
  value,
  onChange
}: {
  videos: PlaylistItem[]
  value: string
  onChange: (channel: string) => void
}) {
  // channel → count, derived from the FULL item list (not filtered)
  const channels = useMemo(() => {
    const counts = new Map<string, Channel>()

    for (const video of videos) {
      const id = video.channel_id ?? NO_CHANNEL
      counts.set(id, {
        id,
        title: video.channel_title ?? 'No channel - deleted/private',
        count: (counts.get(id)?.count ?? 0) + 1
      })
    }

    return [...counts.values()].sort((a, b) => {
      if (a.id === NO_CHANNEL) return -1 // NO_CHANNEL sorts to first
      if (b.id === NO_CHANNEL) return 1
      return a.title.localeCompare(b.title)
    })
  }, [videos])

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor="channel-filter"
        className="text-xs font-medium text-text-secondary"
      >
        Filter by channel
      </label>
      <select
        id="channel-filter"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-surface-raised border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-text-muted transition-colors duration-200 cursor-pointer"
      >
        <option value="">All channels</option>
        {channels.map(channel => (
          <option key={channel.id} value={channel.id}>
            {channel.title} ({channel.count})
          </option>
        ))}
      </select>
    </div>
  )
}
