const multer = require("multer");
const path = require("path");
const fs = require("fs");
const logger = require("../utils/logger");


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    
    let uploadPath = "uploads/";

    if (file.mimetype.startsWith("image/")) {
      uploadPath += "images/";
    } else if (file.mimetype === "application/pdf") {
      uploadPath += "documents/";
    } else {
      uploadPath += "others/";
    }

    
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const fileExt = path.extname(file.originalname);

    
    const fileName = file.originalname
      .replace(fileExt, "")
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]+/g, "")
      .replace(/\-\-+/g, "-")
      .substring(0, 60); 

    cb(null, `${fileName}-${uniqueSuffix}${fileExt}`);
  },
});


const fileFilter = (req, file, cb) => {
  
  const allowedFileTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "application/pdf",
  ];

  if (allowedFileTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `File type not allowed. Accepted types: ${allowedFileTypes.join(", ")}`
      ),
      false
    );
  }
};


const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, 
  },
});


const uploadSingleFile = (fieldName) => {
  return (req, res, next) => {
    const uploader = upload.single(fieldName);

    uploader(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          
          if (err.code === "LIMIT_FILE_SIZE") {
            logger.error(`File size limit exceeded: ${err.message}`);
            return res.status(400).json({
              success: false,
              message: "File size should not exceed 10MB",
            });
          }

          logger.error(`Multer error during file upload: ${err.message}`, {
            error: err,
          });
          return res.status(400).json({
            success: false,
            message: `File upload error: ${err.message}`,
          });
        }

        
        logger.error(`Error during file upload: ${err.message}`, {
          error: err,
        });
        return res.status(500).json({
          success: false,
          message: err.message,
        });
      }

      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: `No file uploaded for field: ${fieldName}`,
        });
      }

      
      logger.info(
        `File successfully uploaded: ${req.file.filename} (${req.file.size} bytes)`
      );

      
      req.fileUrl = `/${req.file.path.replace(/\\/g, "/")}`;

      next();
    });
  };
};


const uploadMultipleFiles = (fieldName, maxCount = 5) => {
  return (req, res, next) => {
    const uploader = upload.array(fieldName, maxCount);

    uploader(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          
          if (err.code === "LIMIT_FILE_SIZE") {
            logger.error(`File size limit exceeded: ${err.message}`);
            return res.status(400).json({
              success: false,
              message: "File size should not exceed 10MB",
            });
          }

          if (err.code === "LIMIT_UNEXPECTED_FILE") {
            logger.error(`Too many files uploaded: ${err.message}`);
            return res.status(400).json({
              success: false,
              message: `Maximum ${maxCount} files allowed`,
            });
          }

          logger.error(`Multer error during files upload: ${err.message}`, {
            error: err,
          });
          return res.status(400).json({
            success: false,
            message: `Files upload error: ${err.message}`,
          });
        }

        
        logger.error(`Error during files upload: ${err.message}`, {
          error: err,
        });
        return res.status(500).json({
          success: false,
          message: err.message,
        });
      }

      
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: `No files uploaded for field: ${fieldName}`,
        });
      }

      
      logger.info(`${req.files.length} files successfully uploaded`);

      
      req.fileUrls = req.files.map((file) => {
        return `/${file.path.replace(/\\/g, "/")}`;
      });

      next();
    });
  };
};


const deleteFile = (filePath) => {
  try {
    
    const normalizedPath = filePath.startsWith("/")
      ? filePath.slice(1)
      : filePath;

    if (fs.existsSync(normalizedPath)) {
      fs.unlinkSync(normalizedPath);
      logger.info(`File deleted: ${normalizedPath}`);
      return true;
    } else {
      logger.warn(`File not found for deletion: ${normalizedPath}`);
      return false;
    }
  } catch (error) {
    logger.error(`Error deleting file ${filePath}: ${error.message}`, {
      error,
    });
    return false;
  }
};


const uploadFields = (fields) => {
  return (req, res, next) => {
    const uploader = upload.fields(fields);

    uploader(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          
          if (err.code === "LIMIT_FILE_SIZE") {
            logger.error(`File size limit exceeded: ${err.message}`);
            return res.status(400).json({
              success: false,
              message: "File size should not exceed 10MB",
            });
          }

          if (err.code === "LIMIT_UNEXPECTED_FILE") {
            logger.error(`Unexpected field in upload: ${err.message}`);
            return res.status(400).json({
              success: false,
              message: `Unexpected field in upload form`,
            });
          }

          logger.error(`Multer error during files upload: ${err.message}`, {
            error: err,
          });
          return res.status(400).json({
            success: false,
            message: `Files upload error: ${err.message}`,
          });
        }

        
        logger.error(`Error during files upload: ${err.message}`, {
          error: err,
        });
        return res.status(500).json({
          success: false,
          message: err.message,
        });
      }

      
      if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({
          success: false,
          message: `No files uploaded`,
        });
      }

      
      const totalFiles = Object.values(req.files).reduce(
        (sum, files) => sum + files.length,
        0
      );
      logger.info(
        `${totalFiles} files successfully uploaded across ${
          Object.keys(req.files).length
        } fields`
      );

      
      req.fieldFileUrls = {};

      for (const [fieldName, files] of Object.entries(req.files)) {
        req.fieldFileUrls[fieldName] = files.map(
          (file) => `/${file.path.replace(/\\/g, "/")}`
        );
      }

      next();
    });
  };
};

module.exports = {
  uploadSingleFile,
  uploadMultipleFiles,
  uploadFields,
  deleteFile,
};
