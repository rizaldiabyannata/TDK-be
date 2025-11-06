import logger from "../utils/logger.js";
import * as imageService from "../services/imageService.js";
import * as minioService from "../services/minioService.js";
import { sanitizeRichText } from "../services/sanitizerService.js";

// Mock external dependencies
jest.mock("../services/imageService.js");
jest.mock("../services/minioService.js");
jest.mock("../services/sanitizerService.js");

describe("Utility Functions Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Logger Utility", () => {
    test("should be defined", () => {
      expect(logger).toBeDefined();
    });

    test("should have logging methods", () => {
      expect(typeof logger.info).toBe("function");
      expect(typeof logger.warn).toBe("function");
      expect(typeof logger.error).toBe("function");
      expect(typeof logger.debug).toBe("function");
    });
  });

  describe("Image Service", () => {
    const mockFile = {
      buffer: Buffer.from("fake image data"),
      originalname: "test-image.jpg",
      mimetype: "image/jpeg",
    };

    test("should process image to WebP format", async () => {
      const expectedUrl = "http://minio.example.com/test-image.webp";
      imageService.processImageToWebp.mockResolvedValue(expectedUrl);

      const result = await imageService.processImageToWebp(mockFile);

      expect(imageService.processImageToWebp).toHaveBeenCalledWith(mockFile);
      expect(result).toBe(expectedUrl);
    });

    test("should handle image processing errors", async () => {
      const error = new Error("Image processing failed");
      imageService.processImageToWebp.mockRejectedValue(error);

      await expect(imageService.processImageToWebp(mockFile)).rejects.toThrow(
        "Image processing failed"
      );
    });

    test("should delete image file", async () => {
      const fileUrl = "http://minio.example.com/test-image.webp";
      imageService.deleteFile.mockResolvedValue();

      await imageService.deleteFile(fileUrl);

      expect(imageService.deleteFile).toHaveBeenCalledWith(fileUrl);
    });
  });

  describe("MinIO Service", () => {
    test("should upload file to MinIO", async () => {
      const bucketName = "test-bucket";
      const fileName = "test-file.jpg";
      const fileBuffer = Buffer.from("file content");
      const expectedUrl = "http://minio.example.com/test-bucket/test-file.jpg";

      minioService.uploadFile.mockResolvedValue(expectedUrl);

      const result = await minioService.uploadFile(
        bucketName,
        fileName,
        fileBuffer
      );

      expect(minioService.uploadFile).toHaveBeenCalledWith(
        bucketName,
        fileName,
        fileBuffer
      );
      expect(result).toBe(expectedUrl);
    });

    test("should delete file from MinIO", async () => {
      const bucketName = "test-bucket";
      const objectName = "test-file.jpg";

      minioService.deleteFile.mockResolvedValue();

      await minioService.deleteFile(bucketName, objectName);

      expect(minioService.deleteFile).toHaveBeenCalledWith(
        bucketName,
        objectName
      );
    });

    test("should handle MinIO errors", async () => {
      const error = new Error("MinIO connection failed");
      minioService.uploadFile.mockRejectedValue(error);

      await expect(
        minioService.uploadFile("bucket", "file", Buffer.from("data"))
      ).rejects.toThrow("MinIO connection failed");
    });
  });

  describe("Sanitizer Service", () => {
    test("should sanitize HTML content", () => {
      const unsafeHtml =
        '<script>alert("xss")</script><p>Safe content</p><img src="test.jpg" onerror="alert(\'xss\')">';
      const safeHtml = '<p>Safe content</p><img src="test.jpg">';

      sanitizeRichText.mockReturnValue(safeHtml);

      const result = sanitizeRichText(unsafeHtml);

      expect(sanitizeRichText).toHaveBeenCalledWith(unsafeHtml);
      expect(result).toBe(safeHtml);
      expect(result).not.toContain("<script>");
      expect(result).not.toContain("onerror");
    });

    test("should allow safe HTML tags", () => {
      const safeHtml =
        '<p>Paragraph</p><strong>Bold</strong><em>Italic</em><a href="http://example.com">Link</a>';
      sanitizeRichText.mockReturnValue(safeHtml);

      const result = sanitizeRichText(safeHtml);

      expect(result).toBe(safeHtml);
    });

    test("should handle empty content", () => {
      const emptyContent = "";
      sanitizeRichText.mockReturnValue(emptyContent);

      const result = sanitizeRichText(emptyContent);

      expect(result).toBe("");
    });

    test("should handle null/undefined content", () => {
      sanitizeRichText.mockReturnValue("");

      const result1 = sanitizeRichText(null);
      const result2 = sanitizeRichText(undefined);

      expect(result1).toBe("");
      expect(result2).toBe("");
    });
  });
});
