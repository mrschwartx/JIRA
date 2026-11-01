export type CommentAuthor = {
  id: string
  username: string
  avatar: string
}

export type Comment = {
  id: string
  issueId: string
  body: string
  author: CommentAuthor | null
  createdAt: string
  updatedAt: string
}
