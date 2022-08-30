const router = require("express").Router();
const crypto = require("crypto");
const bodyParser = require("body-parser");
const { auth } = require("./usefull");
const { createSession, deleteSession } = require("../useSession");
const { findUserByUsername, createUser } = require("../useUser");

const hash = (d) => crypto.createHash("sha512").update(d).digest("hex");

router.post("/login", bodyParser.urlencoded({ extended: false }), async (req, res) => {
  const { password, username } = req.body;
  const pswhash = hash(password);
  const user = await findUserByUsername(req.db, username);
  if (!!user && user.password === pswhash) {
    const sessionId = await createSession(req.db, user._id);
    res.cookie("sessionId", sessionId, { httpOnly: true }).redirect("/");
  } else {
    res.redirect("/?authError=true");
  }
});

router.post("/signup", bodyParser.urlencoded({ extended: false }), async (req, res) => {
  const { password, username } = req.body;
  const user = await findUserByUsername(req.db, username);
  console.log(password, username);

  if (user) {
    res.redirect("/?signError=true");
    return;
  }
  const pswhash = hash(password);
  const body = { username, password: pswhash };
  createUser(req.db, body);
  res.redirect("/");
});

router.get("/", auth(), async (req, res) => {
  res.render("index", {
    user: req.user,
    authError: req.query.authError === "true" ? "Wrong username or password" : req.query.authError,
    signError: req.query.signError === "true" ? "User with this name is already exists" : req.query.signError,
  });
});

router.get("/logout", auth(), async (req, res) => {
  if (!req.user) {
    res.redirect("/");
  } else {
    await deleteSession(req.db, req.sessionId);
    res.clearCookie("sessionId").redirect("/");
  }
});

module.exports = router;
