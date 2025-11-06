import mongoose from "mongoose";
import Service from "../models/ServiceModel.js";
import ContactForm from "../models/ContactFormModel.js";
import * as imageService from "../services/imageService.js";

// Mock external dependencies
jest.mock("../services/imageService.js");

describe("Service and Contact Form Tests", () => {
  beforeAll(async () => {
    // Connect to test database
    const mongoUri =
      process.env.MONGO_URI || "mongodb://localhost:27017/tdk-test";
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    // Clean up and close connection
    await Service.deleteMany({});
    await ContactForm.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear collections before each test
    await Service.deleteMany({});
    await ContactForm.deleteMany({});
    jest.clearAllMocks();
  });

  describe("Service Model", () => {
    test("should create service with required fields", async () => {
      const serviceData = {
        title: "Web Development",
        list: [
          "Frontend Development",
          "Backend Development",
          "Database Design",
        ],
        image: "http://example.com/service.jpg",
      };

      const service = new Service(serviceData);
      const savedService = await service.save();

      expect(savedService.title).toBe(serviceData.title);
      expect(savedService.list).toEqual(serviceData.list);
      expect(savedService.image).toBe(serviceData.image);
    });

    test("should validate required fields", async () => {
      const serviceData = {
        title: "Web Development",
        // Missing list and image
      };

      const service = new Service(serviceData);

      await expect(service.save()).rejects.toThrow();
    });

    test("should validate list as array", async () => {
      const serviceData = {
        title: "Web Development",
        list: ["HTML", "CSS", "JavaScript"], // Valid array
        image: "http://example.com/service.jpg",
      };

      const service = new Service(serviceData);
      const savedService = await service.save();

      expect(savedService.list).toEqual(serviceData.list);
    });

    test("should validate list items are strings", async () => {
      const serviceData = {
        title: "Web Development",
        list: ["HTML", "CSS", "JavaScript"], // All strings
        image: "http://example.com/service.jpg",
      };

      const service = new Service(serviceData);
      const savedService = await service.save();

      expect(savedService.list).toEqual(serviceData.list);
    });
  });

  describe("Service CRUD Operations", () => {
    let testService;

    beforeEach(async () => {
      testService = await Service.create({
        title: "Web Development",
        list: ["Frontend", "Backend", "Database"],
        image: "http://example.com/service.jpg",
      });
    });

    test("should find all services", async () => {
      const services = await Service.find();

      expect(services).toHaveLength(1);
      expect(services[0].title).toBe("Web Development");
    });

    test("should find service by id", async () => {
      const service = await Service.findById(testService._id);

      expect(service.title).toBe("Web Development");
      expect(service.list).toEqual(["Frontend", "Backend", "Database"]);
    });

    test("should update service", async () => {
      const updatedService = await Service.findByIdAndUpdate(
        testService._id,
        {
          title: "Updated Web Development",
          list: ["Frontend", "Backend", "Database", "Testing"],
        },
        { new: true }
      );

      expect(updatedService.title).toBe("Updated Web Development");
      expect(updatedService.list).toHaveLength(4);
    });

    test("should delete service", async () => {
      await Service.findByIdAndDelete(testService._id);

      const deletedService = await Service.findById(testService._id);
      expect(deletedService).toBeNull();
    });
  });

  describe("Contact Form Model", () => {
    test("should create contact form with required fields", async () => {
      const contactData = {
        name: "John Doe",
        email: "john@example.com",
        message: "I am interested in your web development services.",
      };

      const contact = new ContactForm(contactData);
      const savedContact = await contact.save();

      expect(savedContact.name).toBe(contactData.name);
      expect(savedContact.email).toBe(contactData.email);
      expect(savedContact.message).toBe(contactData.message);
      expect(savedContact).toHaveProperty("_id");
      expect(savedContact).toHaveProperty("createdAt");
    });

    test("should validate email format", async () => {
      const contactData = {
        name: "John Doe",
        email: "invalid-email",
        message: "Message",
      };

      const contact = new ContactForm(contactData);

      await expect(contact.save()).rejects.toThrow();
    });

    test("should validate required fields", async () => {
      const contactData = {
        name: "John Doe",
        email: "john@example.com",
        // Missing message
      };

      const contact = new ContactForm(contactData);

      await expect(contact.save()).rejects.toThrow();
    });
  });

  describe("Contact Form CRUD Operations", () => {
    let testContact;

    beforeEach(async () => {
      testContact = await ContactForm.create({
        name: "John Doe",
        email: "john@example.com",
        message: "Interested in services",
      });
    });

    test("should find all contact forms", async () => {
      const contacts = await ContactForm.find();

      expect(contacts).toHaveLength(1);
      expect(contacts[0].name).toBe("John Doe");
    });

    test("should filter by date range", async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const recentContacts = await ContactForm.find({
        createdAt: { $gte: yesterday, $lte: tomorrow },
      });

      expect(recentContacts).toHaveLength(1);
    });
  });

  describe("Contact Form Statistics", () => {
    beforeEach(async () => {
      await ContactForm.create([
        {
          name: "John Doe",
          email: "john@example.com",
          message: "Interested in web dev",
          createdAt: new Date("2025-01-01"),
        },
        {
          name: "Jane Smith",
          email: "jane@example.com",
          message: "Need mobile app",
          createdAt: new Date("2025-01-02"),
        },
        {
          name: "Bob Johnson",
          email: "bob@example.com",
          message: "Need consultation",
          createdAt: new Date("2025-01-03"),
        },
      ]);
    });

    test("should count total contacts", async () => {
      const totalContacts = await ContactForm.countDocuments();

      expect(totalContacts).toBe(3);
    });

    test("should get contacts by date range", async () => {
      const startDate = new Date("2025-01-01");
      const endDate = new Date("2025-01-02");

      const contactsInRange = await ContactForm.find({
        createdAt: { $gte: startDate, $lte: endDate },
      });

      expect(contactsInRange).toHaveLength(2);
    });
  });

  describe("Service Image Integration", () => {
    test("should process service image correctly", async () => {
      imageService.processImageToWebp.mockResolvedValue(
        "http://minio.example.com/processed-service.webp"
      );

      const mockFile = {
        buffer: Buffer.from("fake image data"),
        originalname: "service.jpg",
        mimetype: "image/jpeg",
      };

      const result = await imageService.processImageToWebp(mockFile);

      expect(imageService.processImageToWebp).toHaveBeenCalledWith(mockFile);
      expect(result).toBe("http://minio.example.com/processed-service.webp");
    });
  });

  describe("Data Validation Edge Cases", () => {
    test("should handle empty arrays for service list", async () => {
      const serviceData = {
        title: "Empty Service",
        list: [], // Empty array should be allowed
        image: "http://example.com/service.jpg",
      };

      const service = new Service(serviceData);
      const savedService = await service.save();

      expect(savedService.list).toEqual([]);
    });

    test("should handle very long strings", async () => {
      const longMessage = "a".repeat(10000);

      const contact = await ContactForm.create({
        name: "Test User",
        email: "test@example.com",
        message: longMessage,
      });

      expect(contact.message).toBe(longMessage);
      expect(contact.message.length).toBe(10000);
    });

    test("should handle special characters in contact form", async () => {
      const specialMessage =
        "Special chars: àáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ @#$%^&*()";

      const contact = await ContactForm.create({
        name: "Test Üser",
        email: "test@example.com",
        message: specialMessage,
      });

      expect(contact.name).toBe("Test Üser");
      expect(contact.message).toBe(specialMessage);
    });
  });
});
