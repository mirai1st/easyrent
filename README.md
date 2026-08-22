# EasyRent

### Find a place that feels like home.

EasyRent is a student-focused accommodation platform built to make the search for rental homes simpler, clearer, and more connected. Students can explore available houses, filter their search, manage their account, save places they like, and communicate through one platform.

This project was developed as a Final Year Project for students looking for accommodation throughout their studies.

## What EasyRent Offers

- Search and browse student-friendly rental properties
- Filter listings to find a better match
- Publish rental advertisements as a host
- Create an account and securely sign in
- Manage profiles and account settings
- Receive and manage notifications
- Message other users in real time with Socket.IO
- Upload property and profile images
- Explore the Sudut Pelajar student community space

## Built With

**Frontend**

- HTML, CSS, and vanilla JavaScript
- Font Awesome and Tabler Icons

**Backend**

- Node.js
- Express
- MySQL with `mysql2`
- JWT authentication, cookies, and sessions
- Socket.IO for real-time communication
- Multer for image uploads
- Nodemailer for email support

## Project Structure

```text
.
├── assets/                 # Shared visual assets
├── control-panel/          # Administrative interface
├── css/                    # Shared and homepage styles
├── js/                     # Shared frontend behavior
├── search/                 # Property search page
├── server/                 # API handlers, database, uploads, and sockets
├── sudut-pelajar/          # Student community page
├── users/                  # Profile, messages, notifications, and posting
├── uploads/                # Uploaded property images
├── index.html              # EasyRent homepage
├── server.js               # Express and Socket.IO server
└── package.json            # Project dependencies
```

## Getting Started

### Requirements

- Node.js 18 or newer
- MySQL
- A configured `.env` file with the database and authentication settings required by the server

### Install Dependencies

```bash
npm install
```

### Start the Server

```bash
node server.js
```

Once the server is running, open:

```text
http://localhost:4000
```

The application serves its frontend files and API from the same Express server.

## Main API Areas

The backend currently supports endpoints for:

- Login and registration
- Current-user information and logout
- Profile updates and account deletion
- Rental listing creation
- Unread and full notification retrieval
- Marking individual or all notifications as read
- Real-time messaging support through Socket.IO

## Development Notes

Uploaded files are stored in the project upload directories, while database credentials should remain in `.env` and should never be committed. The project currently has no automated test suite configured, so manual browser testing and API checks are recommended when making changes.

## Project Status

EasyRent is an active academic project under development. The core student rental workflow is in place, with room for future improvements such as richer listing discovery, stronger validation, expanded administration tools, and more polished communication features.

## Author

Built as a Final Year Project with a simple goal: help students spend less time searching for a place to live, and more time settling into student life.
