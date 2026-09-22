// Common Libraries
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");
const http = require("http");

// System Libraries
const db = require("./server/system/db");
const upload = require("./server/system/uploadConfig");
const initSocket = require("./server/system/socket");
const { authenticateToken } = require("./server/system/common");
const houseHandler = require("./server/system/houseHandler");

// Users Libraries
const chatRouter = require("./server/users/chat");
const userHandler = require("./server/users/user");
const notiHandler = require("./server/users/notifications");
const favHandler = require("./server/users/favourite");
const spHandler = require("./server/users/sp")

// Login/Register Handler
const loginHandler = require("./server/login/loginHandler");
const registerHandler = require("./server/login/registerHandler");
const { verifyCode, resendCode } = require("./server/login/verifyHandler");

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
app.post("/api/users/update-profile", authenticateToken, upload.uploadProfile.single("profileImage"), userHandler.updateProfile);


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

// This get the user favourite list (?type=house or ?type=community) with the tab counts
app.get("/api/favourite/get", authenticateToken, favHandler.getFavourites);
// This get only the favourite ids, to fill the heart icons on house/post cards
app.get("/api/favourite/ids", authenticateToken, favHandler.getFavouriteIds);
// This add the post to favourite, or remove it if it is already there
app.post("/api/favourite/toggle", authenticateToken, favHandler.toggleFavourite);


// House Fetch -----------------------------------------------------------------

// Fetch approved house listings using search and filter query parameters.
app.get("/api/house/fetch", houseHandler.fetchHouses);
app.get("/api/house/detail", houseHandler.fetchHouseById);

// Chat Handler ----------------------------------------------------------------

app.use("/api/v1/chat", chatRouter);

// Recommendation Handler ------------------------------------------------------

app.get("/api/recommendations", houseHandler.getRecommendations); // For getting the recommendations from the database

// Sudut pelajar ---------------------------------------------------------------

// This fetch list of post
app.get("/api/v1/sp/fetch", spHandler.fetchPost);
// This send user post
app.post("/api/v1/sp/insert", authenticateToken, upload.uploadSP.array("imgFile", 5), spHandler.insertPost);
// This handle delete post
app.delete("/api/v1/sp/delete/:spID", authenticateToken, spHandler.deletePost);
// This handle liking post
app.post("/api/v1/sp/like/:spID", authenticateToken, spHandler.likePost);
// Add this line in server.js
app.get("/api/v1/sp/likes", authenticateToken, spHandler.getLikedPosts);
// This handle post user comments
app.post("/api/v1/sp/posts/:spID/comments", authenticateToken, spHandler.replyPost);
// This handle fetch comments
app.get("/api/v1/sp/posts/:spID/comments", spHandler.fetchPostReply);
// This handle delete comments
app.delete("/api/v1/sp/posts/delete/:commentId", authenticateToken, spHandler.deletePostReply);


// Search handler --------------------------------------------------------------


// Backend Inserter ------------------------------------------------------------

// Ini untuk post data and image into rent table
app.post( "/api/rent", authenticateToken, upload.uploadHouse.array("images", 5), houseHandler.postHandler);


// -----------------------------------------------------------------------------

// Socket.IO attach to HTTP
const server = http.createServer(app);
const io = initSocket(server);
app.set("io", io);

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