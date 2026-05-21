import { createServer } from "http"
import app from "./app"
import { initializeSocketServer } from "./socket/chatSocket"

const PORT = Number(process.env.PORT ?? 4000)
const HOST = process.env.HOST ?? "0.0.0.0"
const server = createServer(app)

initializeSocketServer(server)

server.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`)
})
