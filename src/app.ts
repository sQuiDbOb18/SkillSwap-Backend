import "dotenv/config"
import express from "express"
import cors from "cors"
import { globalErrorHandler } from "./middleware/errorHandler"
import { notFoundHandler } from "./middleware/notFound"
import { requestLogger } from "./middleware/requestLogger"
import authRoutes from "./routes/authRoutes"
import userRoutes from "./routes/userRoutes"
import skillRoutes from "./routes/skillRoutes"
import bookingRoutes from "./routes/bookingRoutes"
import messageRoutes from "./routes/messageRoutes"
import reviewRoutes from "./routes/reviewRoutes"
import notificationRoutes from "./routes/notificationRoutes"
import walletRoutes from "./routes/walletRoutes"
import adminRoutes from "./routes/adminRoutes"
import reportRoutes from "./routes/reportRoutes"

const app = express()
const apiV1Router = express.Router()

app.use(cors({
    origin: process.env.CLIENT_URL?.split(",") ?? true,
    credentials: true
}))
app.use(requestLogger)
app.use(express.json())

apiV1Router.use("/auth", authRoutes)
apiV1Router.use("/user", userRoutes)
apiV1Router.use("/skills", skillRoutes)
apiV1Router.use("/bookings", bookingRoutes)
apiV1Router.use("/messages", messageRoutes)
apiV1Router.use("/reviews", reviewRoutes)
apiV1Router.use("/notifications", notificationRoutes)
apiV1Router.use("/wallet", walletRoutes)
apiV1Router.use("/reports", reportRoutes)
apiV1Router.use("/admin", adminRoutes)

app.use("/api/v1", apiV1Router)
app.use("/api", apiV1Router)

app.get("/", (req, res) => {
    res.send("Skillswap API is running...")
})

app.use(notFoundHandler)
app.use(globalErrorHandler)

export default app
