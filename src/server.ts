import { createServer } from "http"
import app from "./app"
import { env } from "./config/env"
import { initializeSocketServer } from "./socket/chatSocket"

const PORT = env.PORT
const HOST = env.HOST
const server = createServer(app)

initializeSocketServer(server)

server.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`)
})
