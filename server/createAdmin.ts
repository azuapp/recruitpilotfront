import { storage } from "./storage";
import { hashPassword } from "./auth";

async function createAdminUser() {
  try {
    const adminEmail = "admin@recruitpro.com";
    const adminPassword = "admin123";
    
    // Check if admin already exists
    const existingAdmin = await storage.getUserByEmail(adminEmail);
    if (existingAdmin) {
      console.log("Admin user already exists");
      return;
    }

    // Create admin user
    const hashedPassword = await hashPassword(adminPassword);
    const admin = await storage.createUser({
      email: adminEmail,
      password: hashedPassword,
      firstName: "Admin",
      lastName: "User",
      role: "super_admin",
    });

    console.log("Admin user created successfully:");
    console.log("Email:", adminEmail);
    console.log("Password:", adminPassword);
    console.log("Please change the password after first login!");
  } catch (error) {
    console.error("Failed to create admin user:", error);
  }
}

createAdminUser();