# MERN Social Media App

A full-stack social media application built with the MERN stack (MongoDB, Express.js, React.js, Node.js) featuring real-time chat, posts, comments, likes, follow system, and notifications.

## Features

- **User Authentication**: Register, login, and profile management
- **Social Feed**: Create, view, like, and comment on posts
- **Real-time Chat**: One-to-one and group messaging with Socket.IO
- **Follow System**: Follow/unfollow users
- **Notifications**: Real-time notifications for likes, comments, and follows
- **Media Upload**: Support for images and videos in posts
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: React.js, Vite, Socket.IO Client
- **Backend**: Node.js, Express.js, Socket.IO
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT tokens
- **File Upload**: Multer
- **Real-time**: Socket.IO

## Deployment

### Prerequisites

1. **MongoDB Atlas Account**: Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. **Render Account**: Sign up at [Render](https://render.com)

### Backend Deployment (Render)

1. **Fork/Clone this repository**
2. **Go to [Render Dashboard](https://dashboard.render.com)**
3. **Click "New +" → "Web Service"**
4. **Connect your GitHub repository**
5. **Configure the service:**
   - **Name**: `mern-socialmedia-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

6. **Add Environment Variables:**
   - `MONGO_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: A secure random string for JWT signing
   - `NODE_ENV`: `production`

7. **Deploy the service**

### Frontend Deployment (Render)

1. **In Render Dashboard, click "New +" → "Static Site"**
2. **Connect your GitHub repository**
3. **Configure the service:**
   - **Name**: `mern-socialmedia-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

4. **Add Environment Variable:**
   - `VITE_API_URL`: `https://your-backend-url.onrender.com/api`

5. **Deploy the service**

### Alternative: Vercel Deployment

#### Frontend on Vercel:

1. **Install Vercel CLI**: `npm i -g vercel`
2. **Navigate to frontend directory**: `cd frontend`
3. **Deploy**: `vercel --prod`

#### Backend on Render:

Follow the backend deployment steps above.

## Local Development

### Backend Setup

```bash
cd backend
npm install
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Environment Variables

Create `.env` file in backend directory:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
NODE_ENV=development
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Posts
- `GET /api/posts` - Get all posts
- `POST /api/posts` - Create new post
- `GET /api/posts/feed` - Get user's feed
- `GET /api/posts/explore` - Get explore posts
- `POST /api/posts/:id/like` - Like a post
- `POST /api/posts/:id/unlike` - Unlike a post

### Comments
- `GET /api/comments/:postId` - Get comments for a post
- `POST /api/comments/:postId` - Add comment to a post

### Users
- `POST /api/users/:id/follow` - Follow a user
- `POST /api/users/:id/unfollow` - Unfollow a user

### Chat
- `GET /api/chats/my` - Get user's chats
- `POST /api/chats/create` - Create new chat
- `GET /api/messages/one-to-one/:chatId` - Get one-to-one messages
- `GET /api/messages/group/:groupId` - Get group messages

### Notifications
- `GET /api/notifications` - Get user's notifications
- `PUT /api/notifications/:id/read` - Mark notification as read

## Features in Detail

### Real-time Chat
- One-to-one messaging
- Group chat functionality
- Real-time message delivery
- User search and chat creation

### Social Feed
- Create posts with text and media
- Like/unlike posts
- Comment on posts
- Follow/unfollow users
- Personalized feed based on following

### Notifications
- Real-time notifications for likes, comments, follows
- Notification bell with unread count
- Mark notifications as read

### User Profiles
- View user profiles
- Follow/unfollow users
- Edit own profile

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.