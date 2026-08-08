import { Router } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { requireAdmin } from "../middleware/requireAdmin";
import { ApiError } from "../middleware/errorHandler";

const router = Router();

// Images are stored on local disk under /uploads and served statically by
// Express (see index.ts). No external image-storage account is required to
// run this app.
const UPLOAD_DIR = path.join(process.cwd(), "uploads", "products");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new ApiError(400, "INVALID_FILE", "Only image files are allowed."));
    }
    cb(null, true);
  },
});

// POST /api/uploads/product-image — admin only, saves to local disk
router.post("/product-image", requireAdmin, upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) throw new ApiError(400, "MISSING_FILE", "No file was provided.");

    const publicId = req.file.filename;
    const url = `${req.protocol}://${req.get("host")}/uploads/products/${publicId}`;

    res.status(201).json({ data: { url, publicId } });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/uploads/product-image/:publicId — admin only, removes the file from disk
router.delete("/product-image/:publicId", requireAdmin, async (req, res, next) => {
  try {
    const filePath = path.join(UPLOAD_DIR, req.params.publicId);
    if (!filePath.startsWith(UPLOAD_DIR)) throw new ApiError(400, "INVALID_PATH", "Invalid file reference.");
    fs.rm(filePath, { force: true }, () => {});
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
