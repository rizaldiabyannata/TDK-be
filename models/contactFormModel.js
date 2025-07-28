const mongoose = require("mongoose");

const contactFormSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    // eslint-disable-next-line no-useless-escape
    match: /.+\@.+\..+/,
  },
  message: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const ContactForm = mongoose.model("ContactForm", contactFormSchema);

module.exports = ContactForm;
