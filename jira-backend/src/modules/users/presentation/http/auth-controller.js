export const createAuthController = ({
  registerUser,
  authenticateUser,
  getUser,
  authCookie,
}) => ({
  signUp: async (req, res) => {
    const { user, token } = await registerUser.execute(req.body ?? {});
    authCookie.set(res, token);
    res.status(201).json(user);
  },

  signIn: async (req, res) => {
    const { user, token } = await authenticateUser.execute(req.body ?? {});
    authCookie.set(res, token);
    res.status(200).json(user);
  },

  signOut: async (req, res) => {
    authCookie.clear(res);
    res.status(204).end();
  },

  me: async (req, res) => {
    const user = await getUser.execute({ userId: req.auth.userId });
    res.status(200).json(user);
  },
});
