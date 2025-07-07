const createDOMPurify = require("dompurify");
const { JSDOM } = require("jsdom");
const logger = require("../utils/logger");

// Buat instance JSDOM untuk menyediakan lingkungan 'window' di server
const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);

logger.info("Sanitizer service initialized.");

/**
 * Membersihkan field yang berisi rich text HTML dari sebuah objek.
 * @param {object} data - Objek yang akan disanitasi (misalnya, req.body).
 * @returns {object} Objek dengan field rich text yang sudah bersih.
 */
const sanitizeRichText = (data) => {
  if (!data || typeof data !== "object") {
    return data;
  }

  // Daftar field yang berpotensi berisi rich text HTML
  const fieldsToSanitize = [
    "content",
    "summary",
    "description",
    "shortDescription",
  ];

  const sanitizedData = { ...data };

  for (const field of fieldsToSanitize) {
    if (sanitizedData[field] && typeof sanitizedData[field] === "string") {
      const originalLength = sanitizedData[field].length;
      sanitizedData[field] = DOMPurify.sanitize(sanitizedData[field]);

      if (sanitizedData[field].length < originalLength) {
        logger.warn(`Sanitasi dilakukan pada field '${field}'.`);
      }
    }
  }

  return sanitizedData;
};

module.exports = {
  sanitizeRichText,
};
