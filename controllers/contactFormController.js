const ContactForm = require("../models/contactFormModel");
const logger = require("../utils/logger");

const submitContactForm = async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    logger.warn("❌ Form submission failed: Missing required fields.");
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const newContactForm = new ContactForm({
      name,
      email,
      message,
    });

    await newContactForm.save();

    logger.info(`✅ New contact form submitted by: ${name}, Email: ${email}`);

    return res.status(201).json({
      message: "Your message has been received. We'll get back to you soon!",
    });
  } catch (error) {
    logger.error(`❌ Error submitting contact form: ${error.message}`);
    return res
      .status(500)
      .json({ message: "Something went wrong, please try again." });
  }
};

const getAllContactForms = async (req, res) => {
  try {
    const contactForms = await ContactForm.find().sort({ createdAt: -1 });

    logger.info("✅ Retrieved all contact forms");

    return res.status(200).json(contactForms);
  } catch (error) {
    logger.error(`❌ Error fetching contact forms: ${error.message}`);
    return res.status(500).json({ message: "Unable to fetch contact forms." });
  }
};

module.exports = { submitContactForm, getAllContactForms };
