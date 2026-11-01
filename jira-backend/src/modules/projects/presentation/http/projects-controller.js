export const createProjectsController = ({
  createProject,
  listProjects,
  getProject,
  updateProject,
  deleteProject,
  listMembers,
  addMember,
  removeMember,
}) => ({
  list: async (req, res) => {
    const projects = await listProjects.execute({
      requesterId: req.auth.userId,
    });
    res.status(200).json(projects);
  },

  create: async (req, res) => {
    const project = await createProject.execute({
      requesterId: req.auth.userId,
      input: req.body,
    });
    res.status(201).json(project);
  },

  get: async (req, res) => {
    const project = await getProject.execute({
      requesterId: req.auth.userId,
      projectId: req.params.projectId,
    });
    res.status(200).json(project);
  },

  update: async (req, res) => {
    const project = await updateProject.execute({
      requesterId: req.auth.userId,
      projectId: req.params.projectId,
      changes: req.body,
    });
    res.status(200).json(project);
  },

  remove: async (req, res) => {
    await deleteProject.execute({
      requesterId: req.auth.userId,
      projectId: req.params.projectId,
    });
    res.status(204).end();
  },

  listMembers: async (req, res) => {
    const members = await listMembers.execute({
      requesterId: req.auth.userId,
      projectId: req.params.projectId,
    });
    res.status(200).json(members);
  },

  addMember: async (req, res) => {
    const member = await addMember.execute({
      requesterId: req.auth.userId,
      projectId: req.params.projectId,
      userId: req.body?.userId,
    });
    res.status(201).json(member);
  },

  removeMember: async (req, res) => {
    await removeMember.execute({
      requesterId: req.auth.userId,
      projectId: req.params.projectId,
      userId: req.params.userId,
    });
    res.status(204).end();
  },
});
