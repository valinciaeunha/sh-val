import multer from "multer";
import multerS3 from "multer-s3";
import config from "../config/index.js";
import s3Client from "../config/s3.js";
import path from "path";
import crypto from "crypto";

// ── Script upload (lua/luau/txt only) ─────────────────────────────────────────
const scriptFileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = ['.lua', '.luau', '.txt'];
    if (allowed.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error("Invalid file type. Only .lua, .luau, and .txt files are allowed."), false);
    }
};

// ── Image upload (jpeg/png/webp/gif) ──────────────────────────────────────────
const imageFileFilter = (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Invalid image type. Only JPEG, PNG, WebP, and GIF are allowed."), false);
    }
};

// ── Generic S3 storage factory ────────────────────────────────────────────────
const makeS3Storage = (bucketName) => multerS3({
    s3: s3Client,
    bucket: bucketName,
    contentType: (req, file, cb) => {
        // For scripts: force text/plain so browsers display inline
        // For images: use the real MIME type
        const ext = path.extname(file.originalname).toLowerCase();
        const isScript = ['.lua', '.luau', '.txt'].includes(ext);
        cb(null, isScript ? "text/plain; charset=utf-8" : file.mimetype);
    },
    metadata: (req, file, cb) => {
        cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
        const folder = req.uploadFolder || "uploads";
        const ext = path.extname(file.originalname).toLowerCase();
        crypto.randomBytes(16, (err, raw) => {
            if (err) return cb(err);
            cb(null, `${folder}/${raw.toString("hex")}${ext}`);
        });
    },
});

// ── Script upload instance ────────────────────────────────────────────────────
const upload = multer({
    storage: makeS3Storage(config.s3.bucketScripts),
    fileFilter: scriptFileFilter,
    limits: { fileSize: config.upload.maxFileSize },
});

// ── Image upload instance ─────────────────────────────────────────────────────
export const imageUpload = multer({
    storage: makeS3Storage(config.s3.bucketImages),
    fileFilter: imageFileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB for images
});

export default upload;
