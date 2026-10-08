export interface YoutubeError {
  cause?: {
    errors?: { reason: string }[]
  }
}
