import path from "path";
import multer from "multer";

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

/**
 * Store uploaded file temporarily in memory.
 *
 * The file will NOT be saved to the Vercel filesystem.
 * We will send file.buffer directly to MongoDB GridFS.
 */
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(
      new Error(
        `Unsupported file type "${ext}". Allowed: ${ALLOWED_EXTENSIONS.join(
          ", ",
        )}`,
      ),
    );
  }

  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,

  limits: {
    fileSize: MAX_FILE_SIZE_MB * 1024 * 1024,
  },
});

export { ALLOWED_EXTENSIONS };
