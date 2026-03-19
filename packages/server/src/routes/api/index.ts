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

api.all('/hello/:name', c =>
  c.json({
    message: `Hello, ${c.req.param('name')}`
  })
)

export default api
