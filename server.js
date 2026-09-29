// Common Libraries
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");
const http = require("http");
const bcrypt = require("bcrypt");

// System Libraries
const db = require("./server/system/db");
const upload = require("./server/system/uploadConfig");
const initSocket = require("./server/system/socket");
const { authenticateToken } = require("./server/system/common");
const houseHandler = require("./server/system/houseHandler");
const adminRouter = require("./server/system/admin");

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

app.use(cors({
    origin: (origin, callback) => {

        // Request tanpa Origin:
        // curl, Postman, server-side request, dll.
        if (!origin) {
            return callback(null, true);
        }

        try {
            const url = new URL(origin);
            const hostname = url.hostname;

            const isLocalhost =
                hostname === "localhost" ||
                hostname === "127.0.0.1" ||
                hostname === "::1" ||
                hostname === "0.0.0.0" ||
                /^192\.168\./.test(hostname) ||
                /^10\./.test(hostname) ||
                /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname);

            const isCloudflareTunnel =
                hostname.endsWith(".trycloudflare.com");

            const allowedOrigins = [
                "http://localhost:4000",
                "http://127.0.0.1:4000",
                "http://[::1]:4000"
            ];

            if (
                allowedOrigins.includes(origin) ||
                isLocalhost ||
                isCloudflareTunnel ||
                origin === "null"
            ) {
                return callback(null, true);
            }

            console.log("❌ CORS blocked:", origin);
            return callback(new Error("Not allowed by CORS"));

        } catch (err) {
            console.log("❌ Invalid Origin:", origin);
            return callback(new Error("Invalid Origin"));
        }
    },

    credentials: true,

    methods: [
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS"
    ],

    allowedHeaders: [
        "Content-Type",
        "Authorization"
    ]
}));


app.use(express.static(path.join(__dirname)));

// Login/Register Handler ------------------------------------------------------

app.post("/api/login", loginHandler); // For handling login
app.post("/api/register", registerHandler); // For handling register
app.post("/api/verify-code", verifyCode); // For confirming the 6-digit email code
app.post("/api/resend-code", resendCode); // For resending the 6-digit email code

// User ------------------------------------------------------------------------

app.get("/api/me", authenticateToken, userHandler.getProfile); // This get the user info
app.post("/api/logout", userHandler.userLogout); // This handles when the user wants to log out 
app.post("/api/update-profile", authenticateToken, upload.uploadProfile.single("images"), userHandler.updateProfile); // This handle when user want to update the profile.
app.patch("/api/change-password", authenticateToken, userHandler.changePassword); // This handle when user want to update their account password
app.delete("/api/delete-account", authenticateToken, userHandler.userAccountDeletion); // This handle when user want to delete the account
app.post("/api/users/update-profile", authenticateToken, upload.uploadProfile.single("profileImage"), userHandler.updateProfile); // This handle when user want to update their account profile
app.get("/api/profile", userHandler.getPublicProfile); // public profile view
app.post("/api/change-role", authenticateToken, userHandler.changeRole); // This handle when user want to change their role to normal user
app.post("/api/users/become-host", authenticateToken, userHandler.becomeHost);

// User Notifications ----------------------------------------------------------

app.get("/api/notifications/unread", authenticateToken, notiHandler.getUnreadNotifications); // This get the unread notifications
app.get("/api/notifications", authenticateToken, notiHandler.getNotification); // This for handling user notifications
app.patch("/api/notifications/:id/read", authenticateToken, notiHandler.setIsRead); // Set is_read = 1 when users read the notification
app.patch("/api/notifications/mark-all-read", authenticateToken, notiHandler.markAllRead); // Set is_read = 1 when users read the notification

// User Favourite --------------------------------------------------------------

app.get("/api/favourite/get", authenticateToken, favHandler.getFavourites); // This get the user favourite list (?type=house or ?type=community) with the tab counts
app.get("/api/favourite/ids", authenticateToken, favHandler.getFavouriteIds); // This get only the favourite ids, to fill the heart icons on house/post cards
app.post("/api/favourite/toggle", authenticateToken, favHandler.toggleFavourite); // This add the post to favourite, or remove it if it is already there

// House Fetch -----------------------------------------------------------------

// Fetch approved house listings using search and filter query parameters.
app.get("/api/house/fetch", houseHandler.fetchHouses);
app.get("/api/house/my-listings", authenticateToken, houseHandler.fetchUserHouses);
app.get("/api/house/detail", houseHandler.fetchHouseById);
// Dapatkan maklumat rumah spesifik pemilik
app.get("/api/house/my-listings/:id", authenticateToken, houseHandler.fetchHouseByIdForOwner);
// Update iklan rumah pemilik
app.put("/api/house/update/:id", authenticateToken, upload.uploadHouse.array("images", 5), houseHandler.updateHouse);
app.delete("/api/house/delete/:id", authenticateToken, houseHandler.deleteHouse);
app.patch("/api/house/status/:id", authenticateToken, houseHandler.updateHouseStatus);

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


// Admin handler --------------------------------------------------------------

app.use("/api", adminRouter); 

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