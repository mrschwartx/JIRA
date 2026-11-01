export const createCommentsController = ({
  listComments,
  createComment,
  updateComment,
  deleteComment,
}) => {
  const scope = (req) => ({
    requesterId: req.auth.userId,
    projectId: req.params.projectId,
    issueId: req.params.issueId,
  });

  return {
    list: async (req, res) => {
      const comments = await listComments.execute(scope(req));
      res.status(200).json(comments);
    },

    create: async (req, res) => {
      const comment = await createComment.execute({
        ...scope(req),
        input: req.body,
      });
      res.status(201).json(comment);
    },

    update: async (req, res) => {
      const comment = await updateComment.execute({
        ...scope(req),
        commentId: req.params.commentId,
        input: req.body,
      });
      res.status(200).json(comment);
    },

    remove: async (req, res) => {
      await deleteComment.execute({
        ...scope(req),
        commentId: req.params.commentId,
      });
      res.status(204).end();
    },
  };
};
