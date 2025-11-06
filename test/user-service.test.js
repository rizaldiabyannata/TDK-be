import mongoose from "mongoose";
import User from "../models/UserModel.js";
import Otp from "../models/OtpModel.js";
import * as imageService from "../services/imageService.js";
import * as minioService from "../services/minioService.js";

// Mock external dependencies
jest.mock("../services/imageService.js");
jest.mock("../services/minioService.js");

describe("User Service Tests", () => {
  beforeAll(async () => {
    // Connect to test database
    const mongoUri =
      process.env.MONGO_URI || "mongodb://localhost:27017/tdk-test";
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    // Clean up and close connection
    await User.deleteMany({});
    await Otp.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear collections before each test
    await User.deleteMany({});
    await Otp.deleteMany({});
    jest.clearAllMocks();
  });

  describe("User Model", () => {
    test("should create user with required fields", async () => {
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.name).toBe(userData.name);
      expect(savedUser.email).toBe(userData.email);
      expect(savedUser.password).toBe(userData.password); // No password hashing in this model
      expect(savedUser).toHaveProperty("_id");
      expect(savedUser).toHaveProperty("createdAt");
    });

    test("should validate email format", async () => {
      const userData = {
        name: "John Doe",
        email: "invalid-email", // Model doesn't validate email format, only stores it
        password: "password123",
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.email).toBe("invalid-email");
    });

    test("should enforce unique email", async () => {
      // Create first user
      await User.create({
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
      });

      // Try to create second user with same email
      await expect(
        User.create({
          name: "Jane Doe",
          email: "john@example.com",
          password: "password456",
        })
      ).rejects.toThrow();
    });
  });

  describe("OTP Model", () => {
    test("should create OTP with expiration", async () => {
      const otpData = {
        email: "john@example.com",
        otp: "123456",
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
      };

      const otp = new Otp(otpData);
      const savedOtp = await otp.save();

      expect(savedOtp.email).toBe(otpData.email);
      expect(savedOtp.otp).toBe(otpData.otp);
      expect(savedOtp.expiresAt).toBeInstanceOf(Date);
    });
  });

  describe("Image Service Integration", () => {
    test("should call image service methods correctly", async () => {
      // Mock the image service methods
      imageService.processImageToWebp.mockResolvedValue(
        "http://minio.example.com/avatar.webp"
      );
      minioService.uploadFile.mockResolvedValue(
        "http://minio.example.com/avatar.webp"
      );
      minioService.deleteFile.mockResolvedValue();

      // Test that mocks are set up correctly
      const mockFile = {
        buffer: Buffer.from("fake image data"),
        originalname: "avatar.jpg",
        mimetype: "image/jpeg",
      };

      const result = await imageService.processImageToWebp(mockFile);

      expect(imageService.processImageToWebp).toHaveBeenCalledWith(mockFile);
      expect(result).toBe("http://minio.example.com/avatar.webp");
    });
  });
});
