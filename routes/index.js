const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.send({ response: "I am alive" }).status(200);
});

router.get("/game", (req, res) => {
    res.send({ response: path.join(__dirname, "") }).status(200);
});

module.exports = router;