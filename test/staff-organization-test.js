import mongoose from "mongoose";
import Staff from "../models/StaffModel.js";
import * as staffService from "../services/staffService.js";

describe("Staff Organizational Structure Tests", () => {
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/tdk-test"
    );
  });

  afterAll(async () => {
    // Clean up and close connection
    await Staff.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear staff collection before each test
    await Staff.deleteMany({});
  });

  describe("Staff Model", () => {
    test("should calculate level automatically based on parent", async () => {
      // Create root level staff
      const ceo = new Staff({
        name: "John CEO",
        position: "CEO",
        short_description: "Company CEO",
        photoUrl: "http://example.com/photo.jpg",
        socialMedia: [],
      });
      await ceo.save();

      expect(ceo.level).toBe(1);

      // Create child staff
      const manager = new Staff({
        name: "Jane Manager",
        position: "Manager",
        short_description: "Department Manager",
        photoUrl: "http://example.com/photo2.jpg",
        socialMedia: [],
        parent: ceo._id,
      });
      await manager.save();

      expect(manager.level).toBe(2);

      // Create grandchild staff
      const employee = new Staff({
        name: "Bob Employee",
        position: "Employee",
        short_description: "Regular Employee",
        photoUrl: "http://example.com/photo3.jpg",
        socialMedia: [],
        parent: manager._id,
      });
      await employee.save();

      expect(employee.level).toBe(3);
    });

    test("should populate children correctly", async () => {
      // Create hierarchy
      const ceo = await Staff.create({
        name: "John CEO",
        position: "CEO",
        short_description: "Company CEO",
        photoUrl: "http://example.com/photo.jpg",
        socialMedia: [],
      });

      const manager = await Staff.create({
        name: "Jane Manager",
        position: "Manager",
        short_description: "Department Manager",
        photoUrl: "http://example.com/photo2.jpg",
        socialMedia: [],
        parent: ceo._id,
      });

      // Fetch CEO with children
      const ceoWithChildren = await Staff.findById(ceo._id).populate(
        "children"
      );

      expect(ceoWithChildren.children).toHaveLength(1);
      expect(ceoWithChildren.children[0].name).toBe("Jane Manager");
    });
  });

  describe("Staff Service", () => {
    test("should get organizational structure", async () => {
      // Create test data
      const ceo = await Staff.create({
        name: "John CEO",
        position: "CEO",
        short_description: "Company CEO",
        photoUrl: "http://example.com/photo.jpg",
        socialMedia: [],
      });

      const manager = await Staff.create({
        name: "Jane Manager",
        position: "Manager",
        short_description: "Department Manager",
        photoUrl: "http://example.com/photo2.jpg",
        socialMedia: [],
        parent: ceo._id,
      });

      const structure = await staffService.getOrganizationalStructure();

      expect(structure).toHaveLength(2);
      expect(structure[0].level).toBe(1);
      expect(structure[1].level).toBe(2);
    });

    test("should get staff by level", async () => {
      // Create test data
      await Staff.create({
        name: "John CEO",
        position: "CEO",
        short_description: "Company CEO",
        photoUrl: "http://example.com/photo.jpg",
        socialMedia: [],
      });

      await Staff.create({
        name: "Jane Manager",
        position: "Manager",
        short_description: "Department Manager",
        photoUrl: "http://example.com/photo2.jpg",
        socialMedia: [],
        parent: null, // Same level as CEO
      });

      const level1Staff = await staffService.getStaffByLevel(1);

      expect(level1Staff).toHaveLength(2);
      expect(level1Staff.every((staff) => staff.level === 1)).toBe(true);
    });

    test("should move staff and update levels", async () => {
      // Create test hierarchy
      const ceo = await Staff.create({
        name: "John CEO",
        position: "CEO",
        short_description: "Company CEO",
        photoUrl: "http://example.com/photo.jpg",
        socialMedia: [],
      });

      const manager1 = await Staff.create({
        name: "Jane Manager",
        position: "Manager 1",
        short_description: "Department Manager",
        photoUrl: "http://example.com/photo2.jpg",
        socialMedia: [],
        parent: ceo._id,
      });

      const manager2 = await Staff.create({
        name: "Bob Manager",
        position: "Manager 2",
        short_description: "Department Manager",
        photoUrl: "http://example.com/photo3.jpg",
        socialMedia: [],
        parent: ceo._id,
      });

      const employee = await Staff.create({
        name: "Alice Employee",
        position: "Employee",
        short_description: "Regular Employee",
        photoUrl: "http://example.com/photo4.jpg",
        socialMedia: [],
        parent: manager1._id,
      });

      // Move employee under manager2
      await staffService.moveStaff(employee._id, manager2._id);

      // Refresh data
      const updatedEmployee = await Staff.findById(employee._id);
      const updatedManager1 = await Staff.findById(manager1._id);
      const updatedManager2 = await Staff.findById(manager2._id);

      expect(updatedEmployee.level).toBe(3); // CEO (1) -> Manager2 (2) -> Employee (3)
      expect(updatedEmployee.parent.toString()).toBe(manager2._id.toString());
    });

    test("should prevent circular references when moving staff", async () => {
      // Create hierarchy: CEO -> Manager -> Employee
      const ceo = await Staff.create({
        name: "John CEO",
        position: "CEO",
        short_description: "Company CEO",
        photoUrl: "http://example.com/photo.jpg",
        socialMedia: [],
      });

      const manager = await Staff.create({
        name: "Jane Manager",
        position: "Manager",
        short_description: "Department Manager",
        photoUrl: "http://example.com/photo2.jpg",
        socialMedia: [],
        parent: ceo._id,
      });

      // Try to move CEO under Manager (should fail)
      await expect(
        staffService.moveStaff(ceo._id, manager._id)
      ).rejects.toThrow(
        "Tidak dapat memindahkan staf ke bawah dirinya sendiri"
      );
    });

    test("should toggle staff active status", async () => {
      const staff = await Staff.create({
        name: "John Doe",
        position: "Employee",
        short_description: "Regular Employee",
        photoUrl: "http://example.com/photo.jpg",
        socialMedia: [],
        isActive: true,
      });

      await staffService.toggleStaffStatus(staff._id, false);

      const updatedStaff = await Staff.findById(staff._id);
      expect(updatedStaff.isActive).toBe(false);
    });
  });
});
