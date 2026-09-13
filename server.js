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
const houseHandler = require("./server/houseHandler");

// Users Libraries
const chatHandler = require("./server/users/chatHandler");
const userHandler = require("./server/users/userHandler");
const notiHandler = require("./server/users/notifications/notificationsHandler");

// Login/Register Handler
const loginHandler = require("./server/loginHandler");
const registerHandler = require("./server/registerHandler");
const { verifyCode, resendCode } = require("./server/verifyHandler");

// -----------------------------------------------------------------------------

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: "http://localhost:4000", credentials: true }));

app.use(express.static(path.join(__dirname)));

// Login/Register Handler ------------------------------------------------------

app.post("/api/login", loginHandler); // For handling login
app.post("/api/register", registerHandler); // For handling register
app.post("/api/verify-code", verifyCode); // For confirming the 6-digit email code
app.post("/api/resend-code", resendCode); // For resending the 6-digit email code


// User ------------------------------------------------------------------------

// This get the user info
app.get("/api/me", authenticateToken, userHandler.getProfile);
// This handles when the user wants to log out 
app.post("/api/logout", userHandler.userLogout);
// This handle when user want to update the profile.
app.post("/api/update-profile", authenticateToken, upload.uploadProfile.single("images"), userHandler.updateProfile);
// This handle when user want to delete the account
app.delete("/api/delete-account", authenticateToken, userHandler.userAccountDeletion);
// This handle when user want to update their account profile
app.post("/api/users/update-profile", authenticateToken, userHandler.updateProfile);


// User Notifications ----------------------------------------------------------

// This get the unread notifications
app.get("/api/notifications/unread", authenticateToken, notiHandler.getUnreadNotifications);
// This for handling user notifications
app.get("/api/notifications", authenticateToken, notiHandler.getNotification);
// Set is_read = 1 when users read the notification
app.patch("/api/notifications/:id/read", authenticateToken, notiHandler.setIsRead);
// Set is_read = 1 when users read the notification
app.patch("/api/notifications/mark-all-read", authenticateToken, notiHandler.markAllRead);


// User Favourite --------------------------------------------------------------

// TODO: This get the user favourite object
// app.get("/api/favourite/get", authenticateToken)
// TODO: This insert user favourite object
// app.get("/api/favourite/insert", authenticateToken)
// TODO: This delete user favourite object
// app.get("/api/favourite/delete", authenticateToken)


// House Fetch -----------------------------------------------------------------

// Fetch approved house listings using search and filter query parameters.
app.get("/api/house/fetch", houseHandler.fetchHouses);
app.get("/api/house/detail", houseHandler.fetchHouseById);


// Chat Handler ----------------------------------------------------------------

// TODO: This is not done yet
// app.use("/api", chatHandler); 


// Recommendation Handler ------------------------------------------------------

app.get("/api/recommendations", houseHandler.getRecommendations); // For getting the recommendations from the database

// Sudut pelajar ---------------------------------------------------------------

// TODO: This fetch list of post

// TODO: This send user post

// Search handler --------------------------------------------------------------


// Backend Inserter ------------------------------------------------------------

// Ini untuk post data and image into rent table
app.post( "/api/rent", authenticateToken, upload.uploadHouse.array("images", 5), houseHandler.postHandler);


// -----------------------------------------------------------------------------

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