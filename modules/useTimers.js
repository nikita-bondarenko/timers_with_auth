const { ObjectId } = require("./mongo");

class Timer {
  constructor(body) {
    const description = body.description;
    const start = Date.now();
    const userId = ObjectId(body.userId);
    return {
      userId,
      start,
      description,
      isActive: true,
    };
  }
}

const findTimersByUserId = async (db, id) => {
  const timers = await db
    .collection("timers")
    .find({ userId: ObjectId(id) })
    .toArray();
  return timers;
};

module.exports = {
  async stopTimer(db, timerId) {
    try {
      const { modifiedId } = await db.collection("timers").updateOne(
        {
          _id: ObjectId(timerId.toString()),
        },
        {
          $set: { isActive: false },
        }
      );
      return modifiedId;
    } catch (err) {
      console.error(err);
    }
  },

  async createTimer(db, { userId, description }) {
    const { insertedId } = await db.collection("timers").insertOne(new Timer({ userId, description }));
    return insertedId;
  },
  getTimers: async (db, userId, isActive) => {
    const timers = await findTimersByUserId(db, userId);
    const now = Date.now();
    const soughtData = timers.reduce((arr, item) => {
      return item.isActive === isActive
        ? [
            ...arr,
            {
              ...item,
              progress: now - item.start,
              end: now,
              _id: item._id.toString(),
              duration: now - item.start,
            },
          ]
        : arr;
    }, []);

    return soughtData;
  },
};
