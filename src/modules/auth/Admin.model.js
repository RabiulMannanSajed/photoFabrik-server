import { model, Schema } from "mongoose";
import bcrypt from "bcryptjs";

const adminSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["owner", "staff"],
      default: "staff",
    },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true },
);

adminSchema.statics.hashPassword = function (plain) {
  return bcrypt.hash(plain, 10);
};

adminSchema.methods.checkPassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

export const Admin = model("Admin", adminSchema);
