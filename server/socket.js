const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const cookie = require("cookie");
const db = require("./db");

const SECRET_KEY = process.env.JWT_SECRET;

function initSocket(httpServer) {
    const io = new Server(httpServer, {
        cors: { origin: "http://localhost:4000", credentials: true }
    });

    // Sahkan JWT dari httpOnly cookie sebelum benarkan socket connect
    io.use((socket, next) => {
        try {
            const cookies = cookie.parse(socket.handshake.headers.cookie || "");
            const decoded = jwt.verify(cookies.token, SECRET_KEY);
            socket.username = decoded.username;
            next();
        } catch (err) {
            next(new Error("Unauthorized"));
        }
    });

    io.on("connection", (socket) => {
        console.log(`${socket.username} connected (socket ${socket.id})`);

        // Join room ikut conversationID supaya mesej hanya sampai kat 2 orang dalam conversation tu
        socket.on("join_conversation", (conversationID) => {
            socket.join(`conversation_${conversationID}`);
        });

        socket.on("send_message", async ({ conversationID, message }) => {
            if (!conversationID || !message || !message.trim()) return;

            try {
                const [result] = await db.execute(
                    "INSERT INTO messages (conversationID, senderUsername, message) VALUES (?, ?, ?)",
                    [conversationID, socket.username, message]
                );

                await db.execute(
                    "UPDATE conversations SET lastMessage = ? WHERE conversationID = ?",
                    [message, conversationID]
                );

                const payload = {
                    messageID: result.insertId,
                    conversationID,
                    senderUsername: socket.username,
                    message,
                    createdAt: new Date()
                };

                // Hantar ke semua orang dalam room ni (termasuk sender, untuk konsistensi UI)
                io.to(`conversation_${conversationID}`).emit("receive_message", payload);
            } catch (err) {
                console.error("Error saving message:", err);
                socket.emit("chat_error", { message: "Gagal hantar mesej." });
            }
        });

        socket.on("disconnect", () => {
            console.log(`${socket.username} disconnected`);
        });
    });

    return io;
}

module.exports = initSocket;