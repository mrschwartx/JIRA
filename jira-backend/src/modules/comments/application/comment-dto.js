export const toCommentDto = (view) => ({
  id: view.id,
  issueId: view.issueId,
  body: view.body,
  author: view.author,
  createdAt: view.createdAt,
  updatedAt: view.updatedAt,
});
