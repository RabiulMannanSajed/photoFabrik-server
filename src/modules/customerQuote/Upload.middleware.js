import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import multer from "multer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, "..", "uploads", "quotes");

const ALLOWED_EXTENSIONS = [
  ".dwg",
  ".dxf",
  ".sldprt",
  ".sldasm",
  ".ipt",
  ".iam",
  ".catpart",
  ".catproduct",
  ".prt",
  ".asm",
  ".step",
  ".stp",
  ".iges",
  ".igs",
  ".x_t",
  ".x_b",
];

const MAX_FILE_SIZE_MB = 100;

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path
      .basename(file.originalname, ext)
      .replace(/[^a-z0-9_-]/gi, "_")
      .slice(0, 60);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${base}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(
      new Error(
        `Unsupported file type "${ext}". Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`,
      ),
    );
  }
  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024 },
});

export { ALLOWED_EXTENSIONS, UPLOAD_DIR };
