import { Prisma } from "@prisma/client"
import prisma from "../config/db"

const userProfileSelect: Prisma.UserSelect = {
    id: true,
    email: true,
    pendingEmail: true,
    username: true,
    fullName: true,
    phoneNumber: true,
    age: true,
    bio: true,
    profileImage: true,
    role: true,
    isVerified: true,
    lastSeenAt: true,
    createdAt: true,
    deletedAt: true,
    deletionReason: true,
    skills: true
}

export const createUser = (data: Prisma.UserCreateInput) => {
    return prisma.user.create({ data })
}

export const upsertPendingRegistration = (data: {
    email: string
    fullName: string
    password: string
    verificationCode: string
    verificationCodeExpires: Date
}) => {
    return prisma.pendingRegistration.upsert({
        where: { email: data.email },
        update: {
            fullName: data.fullName,
            password: data.password,
            verificationCode: data.verificationCode,
            verificationCodeExpires: data.verificationCodeExpires
        },
        create: data
    })
}

export const findPendingRegistrationByVerificationCode = (hashedCode: string) => {
    return prisma.pendingRegistration.findFirst({
        where: { verificationCode: hashedCode }
    })
}

export const findPendingRegistrationByEmail = (email: string) => {
    return prisma.pendingRegistration.findUnique({
        where: { email }
    })
}

export const deletePendingRegistration = (id: string) => {
    return prisma.pendingRegistration.delete({
        where: { id }
    })
}

export const findUserByEmail = (email: string) => {
    return prisma.user.findFirst({
        where: {
            email,
            deletedAt: null
        }
    })
}

export const findUserByPendingEmail = (pendingEmail: string) => {
    return prisma.user.findFirst({
        where: {
            pendingEmail,
            deletedAt: null
        }
    })
}

export const findAnyUserByEmail = (email: string) => {
    return prisma.user.findUnique({ where: { email } })
}

export const findUserByUsername = (username: string) => {
    return prisma.user.findFirst({
        where: {
            username,
            deletedAt: null
        }
    })
}

export const findAnyUserByUsername = (username: string) => {
    return prisma.user.findUnique({ where: { username } })
}

export const findUserByPhoneNumber = (phoneNumber: string) => {
    return prisma.user.findFirst({
        where: {
            phoneNumber,
            deletedAt: null
        }
    })
}

export const findAnyUserByPhoneNumber = (phoneNumber: string) => {
    return prisma.user.findUnique({ where: { phoneNumber } })
}

export const findUserById = (id: string) => {
    return prisma.user.findFirst({
        where: {
            id,
            deletedAt: null
        },
        select: userProfileSelect
    })
}

export const getUserSessionStats = async (userId: string) => {
    const swapsCompleted = await prisma.booking.count({
        where: {
            status: "COMPLETED",
            type: "SWAP",
            OR: [
                { userId },
                {
                    skill: {
                        userId
                    }
                }
            ]
        }
    })

    return {
        swapsCompleted
    }
}

export const findUserForAuthById = (id: string) => {
    return prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            email: true,
            password: true,
            role: true,
            tokenVersion: true,
            refreshTokenHash: true,
            refreshTokenExpires: true,
            deletedAt: true,
            isVerified: true
        }
    })
}

export const findUserByRefreshTokenHash = (refreshTokenHash: string) => {
    return prisma.user.findFirst({
        where: {
            refreshTokenHash,
            deletedAt: null
        },
        select: {
            id: true,
            role: true,
            tokenVersion: true,
            refreshTokenHash: true,
            refreshTokenExpires: true,
            deletedAt: true
        }
    })
}

export const updateUser = (id: string, data: Prisma.UserUpdateInput) => {
    return prisma.user.update({
        where: { id },
        data,
        select: userProfileSelect
    })
}

export const updateUserLastSeen = (id: string, lastSeenAt: Date) => {
    const data: Prisma.UserUpdateInput = { lastSeenAt }
    const select: Prisma.UserSelect = {
        id: true,
        lastSeenAt: true
    }

    return prisma.user.update({
        where: { id },
        data,
        select
    })
}

export const findUserByVerificationCode = (hashedCode: string) => {
  return prisma.user.findFirst({
    where: {
      verificationCode: hashedCode,
      deletedAt: null,
    },
  });
};

export const findUserByResetToken = (hashedToken: string) => {
  return prisma.user.findFirst({
    where: {
      resetPasswordToken: hashedToken,
      deletedAt: null,
    },
  });
};

export const verifyUser = (id: string) => {
    return prisma.user.update({
        where: { id },
        data: {
            isVerified: true,
            pendingEmail: null,
            verificationCode: null,
            verificationCodeExpires: null
        },
        select: userProfileSelect
    })
}

export const softDeleteUser = (id: string, deletionReason?: string) => {
    return prisma.user.update({
        where: { id },
        data: {
            deletedAt: new Date(),
            deletionReason: deletionReason ?? null,
            pendingEmail: null,
            verificationCode: null,
            verificationCodeExpires: null,
            resetPasswordToken: null,
            resetPasswordExpires: null,
            refreshTokenHash: null,
            refreshTokenExpires: null,
            tokenVersion: {
                increment: 1
            }
        },
        select: userProfileSelect
    })
}

export const restoreDeletedUser = (id: string) => {
    return prisma.user.update({
        where: { id },
        data: {
            deletedAt: null,
            deletionReason: null,
            refreshTokenHash: null,
            refreshTokenExpires: null,
            tokenVersion: {
                increment: 1
            }
        },
        select: {
            id: true,
            email: true,
            role: true,
            tokenVersion: true
        }
    })
}
