import { Hono } from 'hono'
import sync from './sync'

export default new Hono().route('/sync', sync)
