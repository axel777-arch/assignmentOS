import multer from "multer";

export const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024, files: 1 }, fileFilter: (_request, file, callback) => {
  if (file.mimetype !== "application/pdf") return callback(new Error("Only PDF uploads are accepted."));
  callback(null, true);
} });
