import "dotenv/config";
import dns from "dns";
import mongoose from "mongoose";
import { Admin } from "../modules/auth/Admin.model.js";
import { initGridFS } from "../modules/customerQuote/gridfs.js";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const seed = async () => {
  const email = (process.env.ADMIN_EMAIL || "admin@protofabrik.com").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "ChangeMe123!";
  const name = process.env.ADMIN_NAME || "ProtoFabrik Admin";

  await mongoose.connect(
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.z68se.mongodb.net/photofebrik?retryWrites=true&w=majority&appName=Cluster0`,
  );

  initGridFS();

  const existing = await Admin.findOne({ email });
  if (existing) {
    console.log(`Admin ${email} already exists. Updating password...`);
    existing.passwordHash = await Admin.hashPassword(password);
    existing.name = name;
    await existing.save();
    console.log("Password reset complete.");
    process.exit(0);
  }

  const passwordHash = await Admin.hashPassword(password);
  await Admin.create({ email, name, passwordHash, role: "owner" });
  console.log(`Created admin ${email}`);
  console.log("Login credentials:");
  console.log(`  email:    ${email}`);
  console.log(`  password: ${password}`);
  console.log("\n⚠️  Change the password after first login in production.");
  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
