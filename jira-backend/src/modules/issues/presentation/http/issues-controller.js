export const createIssuesController = ({
  createIssue,
  listIssues,
  getIssue,
  updateIssue,
  deleteIssue,
}) => ({
  list: async (req, res) => {
    const issues = await listIssues.execute({
      requesterId: req.auth.userId,
      projectId: req.params.projectId,
      search: req.query.search,
      status: req.query.status,
      type: req.query.type,
      assigneeId: req.query.assigneeId,
    });
    res.status(200).json(issues);
  },

  create: async (req, res) => {
    const issue = await createIssue.execute({
      requesterId: req.auth.userId,
      projectId: req.params.projectId,
      input: req.body,
    });
    res.status(201).json(issue);
  },

  get: async (req, res) => {
    const issue = await getIssue.execute({
      requesterId: req.auth.userId,
      projectId: req.params.projectId,
      issueId: req.params.issueId,
    });
    res.status(200).json(issue);
  },

  update: async (req, res) => {
    const issue = await updateIssue.execute({
      requesterId: req.auth.userId,
      projectId: req.params.projectId,
      issueId: req.params.issueId,
      changes: req.body,
    });
    res.status(200).json(issue);
  },

  remove: async (req, res) => {
    await deleteIssue.execute({
      requesterId: req.auth.userId,
      projectId: req.params.projectId,
      issueId: req.params.issueId,
    });
    res.status(204).end();
  },
});
