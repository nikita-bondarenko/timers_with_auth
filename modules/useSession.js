const { ObjectId } = require("./mongo");

module.exports = {
  async createSession(db, userId) {
    const { insertedId } = await db.collection("sessions").insertOne({
      userId: ObjectId(userId),
    });
    return insertedId;
  },

  async deleteSession(db, sessionId) {
    await db.collection("sessions").deleteOne({ sessionId });
  },
};
