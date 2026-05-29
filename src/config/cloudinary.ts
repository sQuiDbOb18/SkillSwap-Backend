import { v2 as cloudinary } from "cloudinary"
import { env } from "./env"
import { CustomError } from "../utils/CustomError"

export const configureCloudinary = () => {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw new CustomError("Cloudinary is not configured.", 500)
  }

  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  })

  return cloudinary
}

export { cloudinary }
