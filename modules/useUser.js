const { ObjectId } = require("./mongo");

module.exports = {
  async findUserByUsername(db, username) {
    try {
      console.log(username);
      return db.collection("users").findOne({ username });
    } catch (err) {
      console.log(err);
    }
  },

  async findUserBySessionId(db, sessionId) {
    try {
      const session = await db
        .collection("sessions")
        .findOne({ _id: ObjectId(sessionId) }, { projection: { userId: 1 } });
      if (!session) {
        return;
      }

      return db.collection("users").findOne({ _id: ObjectId(session.userId) });
    } catch (err) {
      console.log(err);
    }
  },
  async createUser(db, { username, password }) {
    await db.collection("users").insertOne({
      username,
      password,
    });
  },
};
