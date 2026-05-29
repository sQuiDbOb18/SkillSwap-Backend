import multer from "multer"
import { CustomError } from "../utils/CustomError"

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
])

export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return callback(
        new CustomError("Only JPG, PNG, and WEBP images are allowed.", 400)
      )
    }

    callback(null, true)
  },
})
