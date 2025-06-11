const mongoose = require("mongoose");
const { level } = require("winston");

const managementSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  level: {
    type: String,
    required: true,
    enum: ["director", "manager", "supervisor", "team_lead"],
  },
});
