import { Hono } from 'hono'

const auth = new Hono()

auth.get('/', c => c.text('AUTH'))
auth.get('/:name', c => c.text(c.req.param('name')))

export default auth
