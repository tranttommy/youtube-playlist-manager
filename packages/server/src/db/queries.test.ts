import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test
} from 'bun:test'
import { SQL } from 'bun'
import { migrate } from './migrate'
import { getPlaylistItemsYoutubeIds } from './queries'

const url = process.env.TEST_POSTGRES_URL
if (!url) throw new Error('TEST_POSTGRES_URL is required to run tests')

const sql = new SQL(url)

beforeAll(async () => migrate(sql))

beforeEach(
  async () => sql`TRUNCATE users, playlists, playlist_items, channels CASCADE`
)

afterAll(async () => sql.end())

async function seedDatabase(googleId: string) {
  const [user] = await sql<{ id: string }[]>`
    INSERT INTO users (google_id, email, name)
    VALUES (${googleId}, ${`${googleId}@test.com`}, ${googleId})
    RETURNING id
  `
  const [playlist1] = await sql<{ id: string }[]>`
    INSERT INTO playlists (youtube_id, user_id, title, item_count, published_at)
    VALUES (${`PL_${googleId}1`}, ${user!.id}, 'Test Playlist 1', 1, NOW())
    RETURNING id
  `
  const [playlist2] = await sql<{ id: string }[]>`
    INSERT INTO playlists (youtube_id, user_id, title, item_count, published_at)
    VALUES (${`PL_${googleId}2`}, ${user!.id}, 'Test Playlist 2', 2, NOW())
    RETURNING id
  `
  const [item1] = await sql<{ id: string }[]>`
    INSERT INTO playlist_items (youtube_id, youtube_video_id, playlist_id, title)
    VALUES (${`ITEM_${googleId}1`}, ${`VID_${googleId}1`}, ${playlist1!.id}, 'Test Video 1.1')
    RETURNING id
  `
  const [item2] = await sql<{ id: string }[]>`
    INSERT INTO playlist_items (youtube_id, youtube_video_id, playlist_id, title)
    VALUES (${`ITEM_${googleId}2`}, ${`VID_${googleId}2`}, ${playlist2!.id}, 'Test Video 2.1')
    RETURNING id
  `
  const [item3] = await sql<{ id: string }[]>`
    INSERT INTO playlist_items (youtube_id, youtube_video_id, playlist_id, title)
    VALUES (${`ITEM_${googleId}3`}, ${`VID_${googleId}3`}, ${playlist2!.id}, 'Test Video 2.2')
    RETURNING id
  `
  return {
    userId: user!.id,
    playlistIds: [playlist1!.id, playlist2!.id],
    itemIds: [item1!.id, item2!.id, item3!.id]
  }
}

describe('getPlaylistItemsYoutubeIds', () => {
  test('return videos from a playlist that the user owns', async () => {
    const { userId, playlistIds, itemIds } = await seedDatabase('alice')

    const items = await getPlaylistItemsYoutubeIds(
      sql,
      [itemIds[0]!],
      playlistIds[0]!,
      userId
    )

    expect(items).toHaveLength(1)
    expect(items[0]!.youtube_id).toBe('ITEM_alice1')
  })

  test("does not return another user's items", async () => {
    const alice = await seedDatabase('alice')
    const bob = await seedDatabase('bob')

    // Bob asks for Alice's item in Alice's playlist
    expect(
      await getPlaylistItemsYoutubeIds(
        sql,
        [alice.itemIds[0]!],
        alice.playlistIds[0]!,
        bob.userId
      )
    ).toEqual([])
  })

  test('does not return items from a different playlist', async () => {
    const alice = await seedDatabase('alice')

    // Alice asks for Alice's item in a different playlist
    expect(
      await getPlaylistItemsYoutubeIds(
        sql,
        [alice.itemIds[0]!],
        alice.playlistIds[1]!,
        alice.userId
      )
    ).toEqual([])
  })

  test('throws with nonsense values', async () => {
    const alice = await seedDatabase('alice')

    expect(
      getPlaylistItemsYoutubeIds(
        sql,
        [alice.itemIds[0]!],
        'bleehhhh',
        alice.userId
      )
    ).rejects.toThrow()
    expect(
      getPlaylistItemsYoutubeIds(
        sql,
        [alice.itemIds[0]!],
        alice.playlistIds[0]!,
        'blah'
      )
    ).rejects.toThrow()
    expect(
      getPlaylistItemsYoutubeIds(
        sql,
        ['fake'],
        alice.playlistIds[0]!,
        alice.userId
      )
    ).rejects.toThrow()
  })
})
