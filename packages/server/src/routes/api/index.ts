import { Hono } from 'hono'

const api = new Hono()

api.get('/hello', c =>
  c.json({
    message: 'Hello, world!',
    method: 'GET'
  })
)

api.put('/hello', c =>
  c.json({
    message: 'Hello, world!',
    method: 'PUT'
  })
)

api.get('/counter/:count', c => {
  const count = Number(c.req.param('count'))
  if (Number.isNaN(count))
    return c.json({ error: 'Count is not a number' }, 400)
  return c.json({ count: count + 1 })
})

api.all('/hello/:name', c =>
  c.json({
    message: `Hello, ${c.req.param('name')}`
  })
)

export default api
