const express = require("express");
const router = express.Router();
const userRouters = require("./userRouters");

// import routes
router.use("/test", (req, res) => {
  res.send("Test route is working");
});

router.use("/user", userRouters);

module.exports = router;
