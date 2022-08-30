require("dotenv").config();
const express = require("express");
const nunjucks = require("nunjucks");
const cookieParser = require("cookie-parser");
const { clientPromise } = require("./modules/mongo");
const auth = require("./modules/routes/auth.js");
const WebSocket = require("ws");
const http = require("http");
const { findUserBySessionId } = require("./modules/useUser");
const { createTimer, getTimers, stopTimer } = require("./modules/useTimers");
const cookie = require("cookie");
let db = null;
const app = express();

const clients = new Map();
const server = http.createServer(app);
const wss = new WebSocket.Server({ clientTracking: false, noServer: true });
const getDb = async () => {
  const client = await clientPromise;
  return client.db("timers");
};

app.use(async (req, res, next) => {
  try {
    req.db = await getDb();
    next();
  } catch (err) {
    next(err);
  }
});

server.on("upgrade", async (req, socket, head) => {
  const obj = cookie.parse(req.headers.cookie);
  db = await getDb();
  const sessionId = String(obj.sessionId.split('"').slice(-2, -1));
  let user = null;
  try {
    user = await findUserBySessionId(db, sessionId);
    if (!user) {
      socket.write("HTTP/1.1 401 Unathorized\r\n\r\n");
      socket.destroy();
      return;
    }
  } catch (err) {
    console.error(err);
    return;
  }

  req.userId = user._id.toString();
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit("connection", ws, req);
  });
});

wss.on("connection", async (ws, req) => {
  const { userId } = req;
  clients.set(userId, ws);
  ws.on("message", async (message) => {
    let data = null;
    try {
      data = JSON.parse(message.toString());
    } catch {
      return;
    }

    const sendAllTimers = async (userId, ws) => {
      const activeTimers = await getTimers(db, userId, true);
      const oldTimers = await getTimers(db, userId, false);
      ws.send(JSON.stringify({ type: "all_timers", activeTimers, oldTimers }));
    };
    if (data.type === "all_timers") {
      sendAllTimers(userId, ws);
    } else if (data.type === "active_timers") {
      const activeTimers = await getTimers(db, userId, true);
      ws.send(JSON.stringify({ activeTimers }));
    } else if (data.type === "stop_timer") {
      const timerId = await stopTimer(db, data.timerId);
      ws.send(JSON.stringify({ type: "stop_timer", timerId }));
      sendAllTimers(userId, ws);
    } else if (data.type === "create_timer") {
      const timerId = await createTimer(db, { ...data, userId });
      ws.send(JSON.stringify({ type: "create_timer", timerId: timerId.toString() }));
      sendAllTimers(userId, ws);
    }
  });

  const sendActiveTimers = async (userId, ws) => {
    const activeTimers = await getTimers(db, userId, true);
    ws.send(JSON.stringify({ activeTimers, type: "active_timers" }));
  };
  setInterval(() => {
    Array.from(clients.entries()).forEach(([userId, ws]) => sendActiveTimers(userId, ws));
  }, 1000);

  ws.on("close", () => {
    clients.delete(userId);
  });
});

nunjucks.configure("views", {
  autoescape: true,
  express: app,
  tags: {
    blockStart: "[%",
    blockEnd: "%]",
    variableStart: "[[",
    variableEnd: "]]",
    commentStart: "[#",
    commentEnd: "#]",
  },
});

app.set("view engine", "njk");

app.use(express.json());
app.use(express.static("public"));
app.use(cookieParser());
app.use("/", auth);
const port = process.env.PORT || 3001;

server.listen(port, () => {
  console.log(`  Listening on http://localhost:${port}`);
});
