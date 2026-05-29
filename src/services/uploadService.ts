import { UploadApiResponse } from "cloudinary"
import { configureCloudinary } from "../config/cloudinary"
import { updateUser } from "../repositories/userRepository"
import { CustomError } from "../utils/CustomError"

const uploadBufferToCloudinary = async (
  buffer: Buffer,
  options: {
    folder: string
    publicId: string
  }
) => {
  const client = configureCloudinary()

  return new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = client.uploader.upload_stream(
      {
        folder: options.folder,
        public_id: options.publicId,
        overwrite: true,
        resource_type: "image",
        transformation: [
          {
            width: 512,
            height: 512,
            crop: "fill",
            gravity: "face:auto",
            quality: "auto",
            fetch_format: "auto",
          },
        ],
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed"))
          return
        }

        resolve(result)
      }
    )

    stream.end(buffer)
  })
}

export const uploadUserProfileImage = async (
  userId: string,
  file?: Express.Multer.File
) => {
  if (!file) {
    throw new CustomError("Profile image is required.", 400)
  }

  const result = await uploadBufferToCloudinary(file.buffer, {
    folder: "skillswap/profile-images",
    publicId: userId,
  })

  const user = await updateUser(userId, {
    profileImage: result.secure_url,
  })

  return {
    profileImage: result.secure_url,
    publicId: result.public_id,
    user,
  }
}
