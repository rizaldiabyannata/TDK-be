const express = require("express");
const router = express.Router();
const { getDashboardStats } = require("../controllers/statisticController");

router.get("/", getDashboardStats);

module.exports = router;
