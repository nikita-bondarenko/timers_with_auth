const { findUserBySessionId } = require("../useUser");

module.exports = {
  async isAuthorized(req) {
    const sessionId = req.cookies.sessionId;
    const user = await findUserBySessionId(req.db, sessionId);
    return sessionId && user;
  },
  auth() {
    return async function (req, res, next) {
      if (!req.cookies["sessionId"]) {
        return next();
      }
      const user = await findUserBySessionId(req.db, req.cookies["sessionId"]);
      req.user = user;
      req.sessionId = req.cookies["sessionId"];
      next();
    };
  },
};
