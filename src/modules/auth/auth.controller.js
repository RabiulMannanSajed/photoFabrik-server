import jwt from "jsonwebtoken";
import { Admin } from "./Admin.model.js";

const JWT_SECRET =
  process.env.JWT_SECRET || "dev-only-insecure-secret-change-me";
const TOKEN_TTL = "7d";

const makeToken = (admin) =>
  jwt.sign(
    { sub: admin._id.toString(), email: admin.email, role: admin.role },
    JWT_SECRET,
    { expiresIn: TOKEN_TTL },
  );

/**
 * POST /auth/login  { email, password }
 */
export const login = async (req, res, next) => {
  try {
    const email = String(req.body.email || "")
      .toLowerCase()
      .trim();
    const password = String(req.body.password || "");
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required." });
    }
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials." });
    }
    const ok = await admin.checkPassword(password);
    if (!ok) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials." });
    }
    admin.lastLoginAt = new Date();
    await admin.save();

    const token = makeToken(admin);
    res.status(200).json({
      success: true,
      data: {
        token,
        admin: {
          id: admin._id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /auth/me — verify token, return admin profile.
 */
export const me = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.adminId)
      .select("-passwordHash")
      .lean();
    if (!admin) {
      return res
        .status(401)
        .json({ success: false, message: "Admin not found." });
    }
    res.status(200).json({ success: true, data: admin });
  } catch (err) {
    next(err);
  }
};
