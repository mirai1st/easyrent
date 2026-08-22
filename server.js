// Common Libraries
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");
const http = require("http");

// System Libraries
const db = require("./server/db");
const upload = require("./server/uploadConfig");
const initSocket = require("./server/socket");
const { authenticateToken } = require("./server/commonFunctions");

// Users Libraries
const chatHandler = require("./server/users/chatHandler");
const postHandler = require("./server/houseHandler");
const userHandler = require("./server/users/userHandler");
const notiHandler = require("./server/users/notifications/notificationsHandler");

// Login/Register Handler
const loginHandler = require("./server/loginHandler");
const registerHandler = require("./server/registerHandler");

// -----------------------------------------------------------------------------

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: "http://localhost:4000", credentials: true }));

app.use(express.static(path.join(__dirname)));

app.post("/api/login", loginHandler); // For handling login
app.post("/api/register", registerHandler); // For handling register
app.use("/api", chatHandler); // TODO: This is not done yet

// -----------------------------------------------------------------------------

// This get the user info
app.get("/api/me", authenticateToken, userHandler.getProfile);
// This handles when the user wants to log out 
app.post("/api/logout", userHandler.userLogout);
// This handle when user want to update the profile. TODO: siapkan userprofile frontend
app.post("/api/update-profile", authenticateToken, upload.uploadProfile.single("images"), userHandler.updateProfile);
// This handle when user want to delete the account
app.delete("/api/delete-account", authenticateToken, userHandler.userAccountDeletion);


// User Notifications ----------------------------------------------------------

// This get the unread notifications
app.get("/api/notifications/unread", authenticateToken, notiHandler.getUnreadNotifications);
// This for handling user notifications
app.get("/api/notifications", authenticateToken, notiHandler.getNotification);
// Set is_read = 1 when users read the notification
app.patch("/api/notifications/:id/read", authenticateToken, notiHandler.setIsRead);
// Set is_read = 1 when users read the notification
app.patch("/api/notifications/mark-all-read", authenticateToken, notiHandler.markAllRead);

// -----------------------------------------------------------------------------

// Ini untuk post data and image into rent table
app.post( "/api/rent", authenticateToken, upload.uploadHouse.array("images", 5), postHandler);

// Socket.IO attach to HTTP
const server = http.createServer(app);
initSocket(server);

server.listen(4000, "0.0.0.0", () =>
  console.log("Server running on port 4000"),
);
// -----------------------------------------------------------------------------

process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection:", err);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
});
