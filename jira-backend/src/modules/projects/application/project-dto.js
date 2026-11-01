export const toProjectDto = (project, role) => ({
  id: project.id,
  key: project.key.value,
  name: project.name.value,
  url: project.url.value,
  description: project.description.value,
  category: project.category.value,
  ownerId: project.ownerId,
  role,
  createdAt: project.createdAt,
  updatedAt: project.updatedAt,
});

export const toMemberDto = (member) => ({
  id: member.id,
  username: member.username,
  email: member.email,
  avatar: member.avatar,
  role: member.role,
});
