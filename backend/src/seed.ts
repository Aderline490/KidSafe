import "reflect-metadata";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { AppDataSource } from "./config/database";
import { User, UserRole } from "./entities/User";

dotenv.config();

async function seed() {
  await AppDataSource.initialize();
  console.log("Database connected");

  const userRepo = AppDataSource.getRepository(User);

  const adminEmail = process.env.ADMIN_EMAIL || "admin@kidsafe.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@1234";

  const existing = await userRepo.findOne({ where: { email: adminEmail } });
  if (existing) {
    console.log(`Admin already exists: ${adminEmail}`);
    await AppDataSource.destroy();
    return;
  }

  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(adminPassword, salt);

  const admin = userRepo.create({
    email: adminEmail,
    passwordHash,
    firstName: "System",
    lastName: "Admin",
    role: UserRole.SYSTEM_ADMIN,
    isEmailVerified: true,
    isActive: true,
  });

  await userRepo.save(admin);

  console.log("✅ Admin account created:");
  console.log(`   Email:    ${adminEmail}`);
  console.log(`   Password: ${adminPassword}`);
  console.log("   ⚠️  Change the password after first login!");

  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
