const { MongoClient, ObjectId } = require("mongodb");

const clientPromise = MongoClient.connect(process.env.DB_URI);

module.exports = { clientPromise, ObjectId };
