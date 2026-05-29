const bcrypt = require("bcrypt")
const { PrismaClient, SkillCategory } = require("@prisma/client")

const prisma = new PrismaClient()

const seed = async () => {
  const password = await bcrypt.hash("Password@123", 10)

  const admin = await prisma.user.upsert({
    where: { email: "admin@skillswap.local" },
    update: {},
    create: {
      email: "admin@skillswap.local",
      fullName: "SkillSwap Admin",
      username: "skillswap_admin",
      password,
      role: "Admin",
      isVerified: true,
    },
  })

  const learner = await prisma.user.upsert({
    where: { email: "learner@skillswap.local" },
    update: {},
    create: {
      email: "learner@skillswap.local",
      fullName: "Demo Learner",
      username: "demo_learner",
      password,
      role: "User",
      isVerified: true,
      bio: "Learning backend and cloud fundamentals.",
    },
  })

  const mentor = await prisma.user.upsert({
    where: { email: "mentor@skillswap.local" },
    update: {},
    create: {
      email: "mentor@skillswap.local",
      fullName: "Demo Mentor",
      username: "demo_mentor",
      password,
      role: "User",
      isVerified: true,
      bio: "Teaching TypeScript, APIs, and product engineering.",
    },
  })

  await prisma.wallet.upsert({
    where: { userId: learner.id },
    update: { balance: 100 },
    create: { userId: learner.id, balance: 100 },
  })

  await prisma.wallet.upsert({
    where: { userId: mentor.id },
    update: { balance: 100 },
    create: { userId: mentor.id, balance: 100 },
  })

  const skills = [
    {
      userId: mentor.id,
      title: "Build REST APIs with Express",
      description: "Learn clean Express API structure, validation, and service layers.",
      category: SkillCategory.BACKEND,
      level: "INTERMEDIATE",
      tags: ["express", "typescript", "api"],
      creditCost: 20,
      isBarter: false,
    },
    {
      userId: learner.id,
      title: "React Component Basics",
      description: "Swap a beginner-friendly intro to reusable React components.",
      category: SkillCategory.FRONTEND,
      level: "BEGINNER",
      tags: ["react", "frontend"],
      creditCost: 10,
      isBarter: true,
    },
  ]

  for (const skill of skills) {
    const existing = await prisma.skill.findFirst({
      where: {
        userId: skill.userId,
        title: skill.title,
      },
    })

    if (!existing) {
      await prisma.skill.create({
        data: skill,
      })
    }
  }

  console.log(`Seeded demo data. Admin: ${admin.email}; password: Password@123`)
}

seed()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
