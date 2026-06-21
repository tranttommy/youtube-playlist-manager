import type { ContentfulStatusCode } from 'hono/utils/http-status'

export class AppError extends Error {
  status: ContentfulStatusCode
  constructor(status: ContentfulStatusCode, message: string) {
    super(message)
    this.status = status
  }
}

export const Errors = {
  badRequest: (message = 'Bad request') => new AppError(400, message),
  unauthorized: (message = 'Not authenticated') => new AppError(401, message),
  notFound: (message = 'Not found') => new AppError(404, message),
  internal: (message = 'Internal server error') => new AppError(500, message),
  upstream: (message = 'Upstream service error') => new AppError(502, message)
}
