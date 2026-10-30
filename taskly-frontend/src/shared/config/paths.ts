export const paths = {
  home: '/',
  signUp: '/signup',
  signIn: '/signin',
  profile: '/profile',
  tasks: '/tasks',
  createTask: '/create-task',
  task: (taskId: string) => `/tasks/${taskId}`,
  updateTask: (taskId: string) => `/update-task/${taskId}`,
}
