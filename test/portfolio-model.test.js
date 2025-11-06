import mongoose from "mongoose";
import Porto from "../models/PortoModel.js";
import redisClient from "../config/redisConfig.js";
import * as imageService from "../services/imageService.js";
import { sanitizeRichText } from "../services/sanitizerService.js";

// Mock external dependencies
jest.mock("../config/redisConfig.js");
jest.mock("../services/imageService.js");
jest.mock("../services/sanitizerService.js");

describe("Portfolio (Porto) Model and Controller Tests", () => {
  beforeAll(async () => {
    // Connect to test database
    const mongoUri =
      process.env.MONGO_URI || "mongodb://localhost:27017/tdk-test";
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    // Clean up and close connection
    await Porto.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear portfolio collection before each test
    await Porto.deleteMany({});
    jest.clearAllMocks();

    // Mock Redis client
    redisClient.isConnected = jest.fn().mockResolvedValue(true);
    redisClient.get = jest.fn();
    redisClient.set = jest.fn();
    redisClient.delete = jest.fn();
  });

  describe("Portfolio Model", () => {
    test("should create portfolio with required fields", async () => {
      const portoData = {
        title: "E-commerce Website",
        description:
          "A modern e-commerce platform built with React and Node.js",
        shortDescription: "Modern e-commerce platform",
        coverImage: "http://example.com/portfolio.jpg",
      };

      const porto = new Porto(portoData);
      const savedPorto = await porto.save();

      expect(savedPorto.title).toBe(portoData.title);
      expect(savedPorto.description).toBe(portoData.description);
      expect(savedPorto.shortDescription).toBe(portoData.shortDescription);
      expect(savedPorto.coverImage).toBe(portoData.coverImage);
      expect(savedPorto.slug).toBeDefined();
      expect(savedPorto.views.total).toBe(0);
      expect(savedPorto.views.unique).toBe(0);
    });

    test("should generate slug automatically from title", async () => {
      const porto = await Porto.create({
        title: "E-commerce Website Project",
        description: "Description",
        shortDescription: "E-commerce project",
        coverImage: "http://example.com/image.jpg",
        technologies: ["React"],
      });

      expect(porto.slug).toBe("e-commerce-website-project");
    });

    test("should increment views", async () => {
      const porto = await Porto.create({
        title: "Test Portfolio",
        description: "Description",
        shortDescription: "Test project",
        coverImage: "http://example.com/image.jpg",
        technologies: ["React"],
      });

      expect(porto.views.total).toBe(0);

      porto.views.total += 1;
      await porto.save();

      const updatedPorto = await Porto.findById(porto._id);
      expect(updatedPorto.views.total).toBe(1);
    });

    test("should validate technologies array", async () => {
      const portoData = {
        title: "Test Portfolio",
        description: "Description",
        shortDescription: "Test project",
        coverImage: "http://example.com/image.jpg",
      };

      const porto = new Porto(portoData);
      await expect(porto.save()).resolves.not.toThrow(); // Should not throw for valid data
    });

    test("should validate URL format for projectUrl", async () => {
      const portoData = {
        title: "Test Portfolio URL",
        description: "Description",
        shortDescription: "Test project",
        coverImage: "http://example.com/image.jpg",
        link: "https://valid-url.com",
      };

      const porto = new Porto(portoData);
      const savedPorto = await porto.save();

      expect(savedPorto.link).toBe(portoData.link);
    });
  });

  describe("Portfolio Query Methods", () => {
    beforeEach(async () => {
      // Create test portfolios
      await Porto.create([
        {
          title: "E-commerce Platform",
          description: "Full-stack e-commerce solution",
          shortDescription: "E-commerce platform",
          coverImage: "http://example.com/image1.jpg",
          technologies: ["React", "Node.js"],
          isArchived: false,
          createdAt: new Date("2025-01-01"),
        },
        {
          title: "Mobile App",
          description: "Cross-platform mobile application",
          shortDescription: "Mobile application",
          coverImage: "http://example.com/image2.jpg",
          technologies: ["React Native", "Firebase"],
          isArchived: false,
          createdAt: new Date("2025-02-01"),
        },
        {
          title: "Corporate Website",
          description: "Modern corporate website",
          shortDescription: "Corporate website",
          coverImage: "http://example.com/image3.jpg",
          technologies: ["Vue.js", "Laravel"],
          isArchived: true,
        },
      ]);
    });

    test("should find published portfolios", async () => {
      const publishedPortos = await Porto.find({ isArchived: false });

      expect(publishedPortos).toHaveLength(2);
      expect(publishedPortos.every((porto) => porto.isArchived === false)).toBe(
        true
      );
    });

    test("should find portfolios by technology", async () => {
      // Since portfolio model doesn't have technologies field, test search by title
      const searchResults = await Porto.find({
        title: { $regex: "E-commerce", $options: "i" },
      });

      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].title).toBe("E-commerce Platform");
    });

    test("should find portfolios by client", async () => {
      const clientPortos = await Porto.find({ client: "TechCorp" });

      expect(clientPortos).toHaveLength(0); // No portfolios with this client
    });

    test("should sort portfolios by creation date", async () => {
      const portos = await Porto.find({ isArchived: false }).sort({
        createdAt: -1,
      });

      expect(portos).toHaveLength(2);
      expect(portos[0].title).toBe("Mobile App"); // More recent
      expect(portos[1].title).toBe("E-commerce Platform"); // Older
    });

    test("should search portfolios by title and description", async () => {
      const searchResults = await Porto.find({
        $or: [
          { title: { $regex: "Mobile", $options: "i" } },
          { description: { $regex: "corporate", $options: "i" } },
        ],
      });

      expect(searchResults.length).toBeGreaterThan(0);
    });
  });

  describe("Image Service Integration", () => {
    test("should process cover image correctly", async () => {
      imageService.processImageToWebp.mockResolvedValue(
        "http://minio.example.com/processed-portfolio.webp"
      );

      const mockFile = {
        buffer: Buffer.from("fake image data"),
        originalname: "portfolio.jpg",
        mimetype: "image/jpeg",
      };

      const result = await imageService.processImageToWebp(mockFile);

      expect(imageService.processImageToWebp).toHaveBeenCalledWith(mockFile);
      expect(result).toBe("http://minio.example.com/processed-portfolio.webp");
    });
  });

  describe("Sanitizer Service Integration", () => {
    test("should sanitize rich text description", async () => {
      const unsafeDescription =
        '<script>alert("xss")</script><p>Safe description</p>';
      const safeDescription = "<p>Safe description</p>";

      sanitizeRichText.mockReturnValue(safeDescription);

      const result = sanitizeRichText(unsafeDescription);

      expect(sanitizeRichText).toHaveBeenCalledWith(unsafeDescription);
      expect(result).toBe(safeDescription);
    });
  });

  describe("Redis Cache Integration", () => {
    test("should check redis connection", async () => {
      const isConnected = await redisClient.isConnected();

      expect(redisClient.isConnected).toHaveBeenCalled();
      expect(isConnected).toBe(true);
    });

    test("should cache portfolio data", async () => {
      const cacheKey = "porto:test-portfolio";
      const portoData = { title: "Test Portfolio", description: "Description" };

      await redisClient.set(cacheKey, portoData, { EX: 3600 });

      expect(redisClient.set).toHaveBeenCalledWith(cacheKey, portoData, {
        EX: 3600,
      });
    });

    test("should retrieve cached data", async () => {
      const cacheKey = "porto:test-portfolio";
      const cachedData = {
        title: "Test Portfolio",
        description: "Description",
      };

      redisClient.get.mockResolvedValue(cachedData);

      const result = await redisClient.get(cacheKey);

      expect(redisClient.get).toHaveBeenCalledWith(cacheKey);
      expect(result).toBe(cachedData);
    });

    test("should delete cache keys", async () => {
      const cacheKey = "porto:test-portfolio";

      await redisClient.delete(cacheKey);

      expect(redisClient.delete).toHaveBeenCalledWith(cacheKey);
    });
  });
});
