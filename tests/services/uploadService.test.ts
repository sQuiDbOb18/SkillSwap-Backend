import { jest, describe, it, expect, beforeEach } from "@jest/globals"
import { uploadUserProfileImage } from "../../src/services/uploadService"
import { updateUser } from "../../src/repositories/userRepository"
import { configureCloudinary } from "../../src/config/cloudinary"

jest.mock("../../src/repositories/userRepository", () => ({
  updateUser: jest.fn(),
}))

jest.mock("../../src/config/cloudinary", () => ({
  configureCloudinary: jest.fn(),
}))

const mockedUpdateUser = updateUser as jest.MockedFunction<typeof updateUser>
const mockedConfigureCloudinary = configureCloudinary as jest.MockedFunction<
  typeof configureCloudinary
>

describe("uploadService", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("uploads a profile image to Cloudinary and stores the secure URL", async () => {
    const uploadStream = {
      end: jest.fn(),
    }
    const uploader = {
      upload_stream: jest.fn((options: unknown, callback: any) => {
        callback(null, {
          secure_url: "https://res.cloudinary.com/demo/image/upload/profile.webp",
          public_id: "skillswap/profile-images/user-1",
        })
        return uploadStream
      }),
    }
    mockedConfigureCloudinary.mockReturnValue({ uploader } as never)
    mockedUpdateUser.mockResolvedValue({ id: "user-1" } as never)

    const result = await uploadUserProfileImage("user-1", {
      buffer: Buffer.from("image"),
    } as Express.Multer.File)

    expect(uploader.upload_stream).toHaveBeenCalledWith(
      expect.objectContaining({
        folder: "skillswap/profile-images",
        public_id: "user-1",
        overwrite: true,
      }),
      expect.any(Function)
    )
    expect(uploadStream.end).toHaveBeenCalledWith(Buffer.from("image"))
    expect(mockedUpdateUser).toHaveBeenCalledWith("user-1", {
      profileImage: "https://res.cloudinary.com/demo/image/upload/profile.webp",
    })
    expect(result).toEqual({
      profileImage: "https://res.cloudinary.com/demo/image/upload/profile.webp",
      publicId: "skillswap/profile-images/user-1",
      user: { id: "user-1" },
    })
  })

  it("throws when no profile image is provided", async () => {
    await expect(uploadUserProfileImage("user-1")).rejects.toMatchObject({
      message: "Profile image is required.",
      statusCode: 400,
    })
  })
})
