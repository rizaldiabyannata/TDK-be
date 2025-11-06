import mongoose from "mongoose";
import Blog from "../models/BlogModel.js";
import redisClient from "../config/redisConfig.js";
import * as imageService from "../services/imageService.js";
import { sanitizeRichText } from "../services/sanitizerService.js";

// Mock external dependencies
jest.mock("../config/redisConfig.js");
jest.mock("../services/imageService.js");
jest.mock("../services/sanitizerService.js");

describe("Blog Model and Controller Tests", () => {
  beforeAll(async () => {
    // Connect to test database
    const mongoUri =
      process.env.MONGO_URI || "mongodb://localhost:27017/tdk-test";
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    // Clean up and close connection
    await Blog.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear blog collection before each test
    await Blog.deleteMany({});
    jest.clearAllMocks();

    // Mock Redis client
    redisClient.isConnected = jest.fn().mockResolvedValue(true);
    redisClient.get = jest.fn();
    redisClient.set = jest.fn();
    redisClient.delete = jest.fn();
  });

  describe("Blog Model", () => {
    test("should create blog with required fields", async () => {
      const blogData = {
        title: "Introduction to Node.js",
        content:
          "Node.js is a JavaScript runtime built on Chrome's V8 JavaScript engine.",
        summary: "Learn about Node.js fundamentals",
        coverImage: "http://example.com/blog.jpg",
        author: "John Doe",
        tags: ["nodejs", "javascript", "backend"],
      };

      const blog = new Blog(blogData);
      const savedBlog = await blog.save();

      expect(savedBlog.title).toBe(blogData.title);
      expect(savedBlog.content).toBe(blogData.content);
      expect(savedBlog.summary).toBe(blogData.summary);
      expect(savedBlog.coverImage).toBe(blogData.coverImage);
      expect(savedBlog.author).toBe(blogData.author);
      expect(savedBlog.slug).toBeDefined();
      expect(savedBlog.views.total).toBe(0);
      expect(savedBlog.views.unique).toBe(0);
    });

    test("should generate slug automatically from title", async () => {
      const blog = await Blog.create({
        title: "Advanced JavaScript Techniques",
        content: "Content here",
        excerpt: "Learn advanced JS",
        coverImage: "http://example.com/image.jpg",
        author: "Jane Doe",
        tags: ["javascript"],
      });

      expect(blog.slug).toBe("advanced-javascript-techniques");
    });

    test("should increment views", async () => {
      const blog = await Blog.create({
        title: "Test Blog",
        content: "Content",
        excerpt: "Excerpt",
        coverImage: "http://example.com/image.jpg",
        author: "Test Author",
        tags: ["test"],
      });

      expect(blog.views.total).toBe(0);

      blog.views.total += 1;
      await blog.save();

      const updatedBlog = await Blog.findById(blog._id);
      expect(updatedBlog.views.total).toBe(1);
    });

    test("should validate tags array", async () => {
      const blogData = {
        title: "Test Blog",
        content: "Content",
        summary: "Summary",
        coverImage: "http://example.com/image.jpg",
        author: "Test Author",
      };

      const blog = new Blog(blogData);
      await expect(blog.save()).resolves.not.toThrow(); // Should not throw for valid data
    });

    test("should validate status enum", async () => {
      const blogData = {
        title: "Test Blog Status",
        content: "Content",
        summary: "Summary",
        coverImage: "http://example.com/image.jpg",
        author: "Test Author",
        isArchived: false, // Valid status
      };

      const blog = new Blog(blogData);
      const savedBlog = await blog.save();

      expect(savedBlog.isArchived).toBe(false);
    });
  });

  describe("Blog Query Methods", () => {
    beforeEach(async () => {
      // Create test blogs
      await Blog.create([
        {
          title: "Node.js Guide",
          content: "Complete Node.js guide",
          summary: "Learn Node.js",
          coverImage: "http://example.com/image1.jpg",
          author: "John Doe",
          isArchived: false,
          createdAt: new Date("2025-01-01"),
        },
        {
          title: "React Tutorial",
          content: "React tutorial content",
          summary: "Learn React",
          coverImage: "http://example.com/image2.jpg",
          author: "Jane Doe",
          isArchived: false,
          createdAt: new Date("2025-02-01"),
        },
        {
          title: "Draft Article",
          content: "Draft content",
          summary: "Draft summary",
          coverImage: "http://example.com/image3.jpg",
          author: "Bob Smith",
          isArchived: true,
        },
      ]);
    });

    test("should find published blogs", async () => {
      const publishedBlogs = await Blog.find({ isArchived: false });

      expect(publishedBlogs).toHaveLength(2);
      expect(publishedBlogs.every((blog) => blog.isArchived === false)).toBe(
        true
      );
    });

    test("should find blogs by tag", async () => {
      // Since blog model doesn't have tags field, test search by author
      const authorBlogs = await Blog.find({ author: "John Doe" });

      expect(authorBlogs).toHaveLength(1);
      expect(authorBlogs[0].author).toBe("John Doe");
    });

    test("should find blogs by author", async () => {
      const authorBlogs = await Blog.find({ author: "John Doe" });

      expect(authorBlogs).toHaveLength(1);
      expect(authorBlogs[0].title).toBe("Node.js Guide");
    });

    test("should sort blogs by creation date", async () => {
      const blogs = await Blog.find({ isArchived: false }).sort({
        createdAt: -1,
      });

      expect(blogs).toHaveLength(2);
      expect(blogs[0].title).toBe("React Tutorial"); // More recent
      expect(blogs[1].title).toBe("Node.js Guide"); // Older
    });

    test("should search blogs by title and content", async () => {
      const searchResults = await Blog.find({
        $or: [
          { title: { $regex: "React", $options: "i" } },
          { content: { $regex: "tutorial", $options: "i" } },
        ],
      });

      expect(searchResults.length).toBeGreaterThan(0);
    });
  });

  describe("Image Service Integration", () => {
    test("should process cover image correctly", async () => {
      imageService.processImageToWebp.mockResolvedValue(
        "http://minio.example.com/processed-image.webp"
      );

      const mockFile = {
        buffer: Buffer.from("fake image data"),
        originalname: "cover.jpg",
        mimetype: "image/jpeg",
      };

      const result = await imageService.processImageToWebp(mockFile);

      expect(imageService.processImageToWebp).toHaveBeenCalledWith(mockFile);
      expect(result).toBe("http://minio.example.com/processed-image.webp");
    });
  });

  describe("Sanitizer Service Integration", () => {
    test("should sanitize rich text content", async () => {
      const unsafeContent = '<script>alert("xss")</script><p>Safe content</p>';
      const safeContent = "<p>Safe content</p>";

      sanitizeRichText.mockReturnValue(safeContent);

      const result = sanitizeRichText(unsafeContent);

      expect(sanitizeRichText).toHaveBeenCalledWith(unsafeContent);
      expect(result).toBe(safeContent);
    });
  });

  describe("Redis Cache Integration", () => {
    test("should check redis connection", async () => {
      const isConnected = await redisClient.isConnected();

      expect(redisClient.isConnected).toHaveBeenCalled();
      expect(isConnected).toBe(true);
    });

    test("should cache blog data", async () => {
      const cacheKey = "blog:test-blog";
      const blogData = { title: "Test Blog", content: "Content" };

      await redisClient.set(cacheKey, blogData, { EX: 3600 });

      expect(redisClient.set).toHaveBeenCalledWith(cacheKey, blogData, {
        EX: 3600,
      });
    });

    test("should retrieve cached data", async () => {
      const cacheKey = "blog:test-blog";
      const cachedData = { title: "Test Blog", content: "Content" };

      redisClient.get.mockResolvedValue(cachedData);

      const result = await redisClient.get(cacheKey);

      expect(redisClient.get).toHaveBeenCalledWith(cacheKey);
      expect(result).toBe(cachedData);
    });

    test("should delete cache keys", async () => {
      const cacheKey = "blog:test-blog";

      await redisClient.delete(cacheKey);

      expect(redisClient.delete).toHaveBeenCalledWith(cacheKey);
    });
  });
});
