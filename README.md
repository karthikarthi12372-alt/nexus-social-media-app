# 🌐 Nexus — Full Stack Social Media Platform

A production-ready, full-stack social media web application built with the **MERN stack**, featuring real-time chat, notifications, and a polished, responsive UI with dark/light mode.

![Tech Stack](https://img.shields.io/badge/MERN-Stack-7c3aed) ![License](https://img.shields.io/badge/license-MIT-blue)

---

## ✨ Features

- 🔐 **JWT Authentication** — Secure register/login with bcrypt password hashing
- 👤 **User Profiles** — Editable bio, avatar, cover image, location, website
- 📝 **Posts** — Create, edit, delete posts with up to 4 images (Cloudinary)
- ❤️ **Likes & Comments** — Real-time engagement with notifications
- 🔄 **Follow/Unfollow** — Build your network
- 📰 **News Feed** — Infinite scroll, personalized based on follows
- 🔔 **Real-Time Notifications** — Powered by Socket.IO
- 💬 **Real-Time Chat** — 1-on-1 messaging with typing indicators & online status
- 🔍 **Search** — Find users, posts, and trending hashtags
- 🌗 **Dark/Light Mode** — Persisted theme preference
- 📱 **Responsive Design** — Mobile-first with bottom nav on small screens
- 🛡️ **Security** — Helmet, rate limiting, input sanitization, validation

---

## 🏗️ Tech Stack

| Layer          | Technology                                           |
|----------------|-------------------------------------------------------|
| Frontend       | React 18, React Router 6, Redux Toolkit, Axios       |
| Backend        | Node.js, Express.js, Mongoose                        |
| Database       | MongoDB (Atlas recommended)                          |
| Auth           | JWT + bcrypt                                          |
| Realtime       | Socket.IO                                            |
| Media Storage  | Cloudinary                                            |
| Deployment     | Vercel (frontend), Render/Railway (backend)          |

---

## 📁 Project Structure

```
nexus/
├── backend/
│   ├── config/
│   │   ├── db.js                 # MongoDB connection
│   │   └── cloudinary.js         # Image upload config
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── postController.js
│   │   ├── chatController.js
│   │   ├── notificationController.js
│   │   └── searchController.js
│   ├── middleware/
│   │   ├── auth.js                # JWT protect middleware
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Post.js
│   │   ├── Notification.js
│   │   └── Message.js             # Conversation + Message
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── posts.js
│   │   ├── chat.js
│   │   ├── notifications.js
│   │   ├── search.js
│   │   └── upload.js
│   ├── socket/
│   │   └── socketHandler.js       # Socket.IO logic
│   ├── utils/
│   │   └── logger.js
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── public/
│   │   └── favicon.svg
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/             # Sidebar, MainLayout, MobileNav, RightPanel
│   │   │   ├── post/                # PostCard, CreatePostModal
│   │   │   └── profile/             # EditProfileModal
│   │   ├── pages/
│   │   │   ├── HomePage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── ProfilePage.jsx
│   │   │   ├── PostPage.jsx
│   │   │   ├── ExplorePage.jsx
│   │   │   ├── NotificationsPage.jsx
│   │   │   ├── MessagesPage.jsx
│   │   │   ├── SearchPage.jsx
│   │   │   ├── SettingsPage.jsx
│   │   │   └── NotFoundPage.jsx
│   │   ├── store/                   # Redux Toolkit slices
│   │   │   ├── store.js
│   │   │   ├── authSlice.js
│   │   │   ├── postSlice.js
│   │   │   ├── notificationSlice.js
│   │   │   ├── chatSlice.js
│   │   │   └── uiSlice.js
│   │   ├── services/
│   │   │   ├── api.js               # Axios instance
│   │   │   └── socket.js            # Socket.IO client
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css                # Design system
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
└── README.md
```

---

## 🗄️ Database Schema

### User
```js
{
  username: String (unique, lowercase),
  email: String (unique),
  password: String (hashed, select: false),
  displayName: String,
  bio: String (max 160),
  avatar: String (Cloudinary URL),
  coverImage: String,
  website: String,
  location: String,
  followers: [ObjectId -> User],
  following: [ObjectId -> User],
  savedPosts: [ObjectId -> Post],
  isVerified: Boolean,
  isPrivate: Boolean,
  isActive: Boolean,
  lastSeen: Date,
  timestamps: true
}
```

### Post
```js
{
  author: ObjectId -> User,
  text: String (max 500),
  images: [{ url: String, publicId: String }],
  likes: [ObjectId -> User],
  comments: [{
    user: ObjectId -> User,
    text: String,
    likes: [ObjectId],
    replies: [{ user, text, createdAt }],
    timestamps: true
  }],
  reposts: [ObjectId -> User],
  repostOf: ObjectId -> Post,
  hashtags: [String],
  mentions: [ObjectId -> User],
  visibility: "public" | "followers" | "private",
  isEdited: Boolean,
  views: Number,
  timestamps: true
}
```

### Notification
```js
{
  recipient: ObjectId -> User,
  sender: ObjectId -> User,
  type: "like" | "comment" | "follow" | "mention" | "repost" | "reply",
  post: ObjectId -> Post,
  comment: String,
  isRead: Boolean,
  timestamps: true
}
```

### Conversation & Message
```js
Conversation {
  participants: [ObjectId -> User],
  lastMessage: ObjectId -> Message,
  lastActivity: Date,
  isGroup: Boolean,
  timestamps: true
}

Message {
  conversation: ObjectId -> Conversation,
  sender: ObjectId -> User,
  text: String,
  image: { url, publicId },
  readBy: [ObjectId -> User],
  isDeleted: Boolean,
  timestamps: true
}
```

---

## 🔌 REST API Reference

### Auth — `/api/auth`
| Method | Endpoint     | Description          | Auth |
|--------|--------------|-----------------------|------|
| POST   | `/register`  | Register new user     | No   |
| POST   | `/login`     | Login                  | No   |
| GET    | `/me`        | Get current user       | Yes  |
| POST   | `/logout`    | Logout                 | Yes  |

### Users — `/api/users`
| Method | Endpoint              | Description                |
|--------|------------------------|-----------------------------|
| GET    | `/suggestions`        | Suggested users to follow   |
| GET    | `/saved`              | Get saved posts             |
| GET    | `/:username`          | Get user profile            |
| GET    | `/:username/posts`    | Get user's posts            |
| PUT    | `/profile`            | Update profile (multipart)  |
| POST   | `/:userId/follow`     | Toggle follow/unfollow       |
| POST   | `/:postId/save`       | Toggle save post             |

### Posts — `/api/posts`
| Method | Endpoint                       | Description           |
|--------|---------------------------------|-------------------------|
| GET    | `/feed`                        | Personalized feed (paginated) |
| GET    | `/explore`                      | Explore/trending posts  |
| POST   | `/`                             | Create post (multipart, up to 4 images) |
| GET    | `/:id`                          | Get single post          |
| PUT    | `/:id`                          | Update post               |
| DELETE | `/:id`                          | Delete post                |
| POST   | `/:id/like`                     | Toggle like                 |
| POST   | `/:id/comments`                 | Add comment                  |
| DELETE | `/:id/comments/:commentId`      | Delete comment                |

### Chat — `/api/chat`
| Method | Endpoint                          | Description             |
|--------|------------------------------------|---------------------------|
| GET    | `/conversations`                  | List conversations         |
| GET    | `/conversations/:userId/start`    | Get or create conversation  |
| GET    | `/:conversationId/messages`       | Get messages (paginated)     |
| POST   | `/:conversationId/messages`       | Send message                  |
| DELETE | `/messages/:messageId`            | Delete (soft) message          |

### Notifications — `/api/notifications`
| Method | Endpoint     | Description              |
|--------|--------------|----------------------------|
| GET    | `/`          | List notifications          |
| PUT    | `/read-all`  | Mark all as read              |
| PUT    | `/:id/read`  | Mark one as read               |
| DELETE | `/:id`       | Delete notification             |

### Search — `/api/search`
| Method | Endpoint     | Description                          |
|--------|--------------|----------------------------------------|
| GET    | `/?q=&type=` | Search users/posts/tags (`type`: all, users, posts, tags) |
| GET    | `/trending`  | Trending hashtags (last 7 days)         |

### Upload — `/api/upload`
| Method | Endpoint   | Description                |
|--------|------------|------------------------------|
| POST   | `/image`   | Upload a single image          |
| POST   | `/avatar`  | Upload avatar (cropped 400x400) |

---

## 🔄 Socket.IO Events

| Event             | Direction        | Payload                                    |
|-------------------|------------------|---------------------------------------------|
| `notification`    | server → client | `{ type, sender, postId?, message }`         |
| `newMessage`      | server → client | `{ message, conversationId }`                 |
| `newPost`         | server → client | Full post object                                |
| `typing`          | client ↔ server | `{ conversationId, recipientId/userId }`        |
| `stopTyping`      | client ↔ server | `{ conversationId, recipientId/userId }`         |
| `userOnline`      | server → client | `userId`                                          |
| `userOffline`     | server → client | `userId`                                           |
| `joinConversation`| client → server | `conversationId`                                    |

Authentication: pass JWT via `socket.handshake.auth.token`.

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Cloudinary account (free tier works)

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd nexus

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Backend Environment Setup

Copy `.env.example` to `.env` in `/backend`:

```bash
cd backend
cp .env.example .env
```

Fill in your `.env`:

```env
PORT=5000
NODE_ENV=development

MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/nexus

JWT_SECRET=your_super_secret_jwt_key_min_32_chars
JWT_EXPIRES_IN=7d

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

CLIENT_URL=http://localhost:5173
```

### 3. Frontend Environment Setup

```bash
cd frontend
cp .env.example .env
```

```env
VITE_API_URL=import.meta.env.VITE_API_URL
VITE_SOCKET_URL=import.meta.env.VITE_SOCKET_URL
```

### 4. Run Locally

```bash
# Terminal 1 — Backend
cd backend
npm run dev      # nodemon, runs on :5000

# Terminal 2 — Frontend
cd frontend
npm run dev      # Vite, runs on :5173
```

Visit **http://localhost:5173** 🎉

---

## ☁️ Deployment

### Backend (Render / Railway)

1. Push your repo to GitHub.
2. Create a new **Web Service** on Render/Railway, pointing to `/backend`.
3. Build command: `npm install`
4. Start command: `npm start`
5. Add all environment variables from `.env` in the dashboard.
6. Set `CLIENT_URL` to your deployed frontend URL.

### Frontend (Vercel)

1. Import your repo into Vercel.
2. Set **Root Directory** to `frontend`.
3. Framework preset: **Vite**
4. Add environment variables:
   - `VITE_API_URL=https://your-backend.onrender.com/api`
   - `VITE_SOCKET_URL=https://your-backend.onrender.com`
5. Deploy.

> ⚠️ Remember to update CORS `CLIENT_URL` on the backend to match your final Vercel domain, and update Cloudinary's allowed origins if applicable.

---

## 🔒 Security Checklist

- ✅ Passwords hashed with bcrypt (cost factor 12)
- ✅ JWT tokens with configurable expiry
- ✅ Helmet for HTTP headers
- ✅ express-mongo-sanitize against NoSQL injection
- ✅ Rate limiting (100 req / 15 min per IP)
- ✅ Input validation via express-validator
- ✅ File upload size limits (5MB posts, 2MB avatars)
- ✅ CORS restricted to configured client origin

---

## 📜 License

MIT — free to use for personal and commercial projects.
