const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const cookie = require("cookie");

const SECRET_KEY = process.env.JWT_SECRET;

function initSocket(httpServer) {

    const io = new Server(httpServer, {
        cors: {
            origin: "http://localhost:4000",
            credentials: true
        }
    });

    // =====================================================
    // AUTHENTICATE SOCKET
    // =====================================================

    io.use((socket, next) => {

        try {

            const cookies = cookie.parse(
                socket.handshake.headers.cookie || ""
            );

            const decoded = jwt.verify(
                cookies.token,
                SECRET_KEY
            );

            socket.username = decoded.username;

            next();

        } catch (err) {

            console.error(
                "Socket authentication failed:",
                err.message
            );

            next(new Error("Unauthorized"));
        }
    });

    // =====================================================
    // CONNECTION
    // =====================================================

    io.on("connection", (socket) => {

        const username = socket.username;

        console.log(
            `${username} connected (socket ${socket.id})`
        );

        // =================================================
        // USER ROOM
        // =================================================

        // Every user gets their own room.
        // Used for checking online status.
        socket.join(`user_${username}`);

        // =================================================
        // JOIN CONVERSATION
        // =================================================

        socket.on(
            "join_conversation",
            (conversationId) => {

                const room =
                    `conversation_${conversationId}`;

                socket.join(room);

                console.log(
                    `${username} joined ${room}`
                );
            }
        );

        // =================================================
        // LEAVE CONVERSATION
        // =================================================

        socket.on(
            "leave_conversation",
            (conversationId) => {

                const room =
                    `conversation_${conversationId}`;

                socket.leave(room);

                console.log(
                    `${username} left ${room}`
                );
            }
        );

        // =================================================
        // CHECK ONLINE STATUS
        // =================================================

        socket.on(
            "check_online_status",
            async (targetUsername, callback) => {

                try {

                    const sockets =
                        await io
                            .in(`user_${targetUsername}`)
                            .fetchSockets();

                    const isOnline =
                        sockets.length > 0;

                    callback({
                        online: isOnline
                    });

                } catch (err) {

                    console.error(
                        "Online status error:",
                        err
                    );

                    callback({
                        online: false
                    });
                }
            }
        );

        // =================================================
        // DISCONNECT
        // =================================================

        socket.on("disconnect", () => {

            console.log(
                `${username} disconnected (socket ${socket.id})`
            );

        });

    });

    return io;
}

module.exports = initSocket;
