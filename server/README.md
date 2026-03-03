# Dev Analyzer Backend

A Node.js/Express backend API for the Developer Analytics Dashboard.

## 📋 Features

- User profile management
- Coding platform statistics (LeetCode, GeeksforGeeks, Codeforces)
- Aggregated analytics and progress tracking
- Programming language statistics
- Algorithm/problem category tracking
- RESTful API endpoints

## 🚀 Setup & Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (already included):
```bash
PORT=5000
NODE_ENV=development
CORS_ORIGIN=https://developer-analyzer.vercel.app
```

## 🏃 Running the Server

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:5000`

## 📚 API Endpoints

### Profile (`/api/profile`)
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update user profile

### Platforms (`/api/platforms`)
- `GET /api/platforms` - Get all platforms
- `GET /api/platforms/:id` - Get specific platform
- `GET /api/platforms/stats/summary` - Get platform summary

### Statistics (`/api/stats`)
- `GET /api/stats` - Get aggregated statistics (mock)
- `GET /api/stats/difficulty` - Get difficulty breakdown (mock)
- `GET /api/stats/rating` - Get rating statistics (mock)
- `GET /api/stats/leetcode/:username` - Fetch live LeetCode stats for a specific user
- `GET /api/stats/analytics?leetcode=<user>&geeksforgeeks=<user>` - Combined analytics (languages & algorithms) for provided handles. Query parameters are optional; missing values will be ignored.

### Progress (`/api/progress`)
- `GET /api/progress/weekly` - Get weekly progress
- `GET /api/progress/daily/:day` - Get daily progress

### Languages (`/api/languages`)
- `GET /api/languages` - Get all languages
- `GET /api/languages/stats` - Get language statistics
- `GET /api/languages/top/:limit` - Get top languages

### Algorithms (`/api/algorithms`)
- `GET /api/algorithms` - Get all algorithm categories (pass `leetcode`/`geeksforgeeks` query params to compute from live data)
- `GET /api/algorithms/stats` - Get algorithm statistics
- `GET /api/algorithms/top/:limit` - Get top categories

### Health Check
- `GET /api/health` - Server health status

## 📝 Example Requests

### Get User Profile
```bash
curl http://localhost:5000/api/profile
```

### Get All Platforms
```bash
curl http://localhost:5000/api/platforms
```

### Get Weekly Progress
```bash
curl http://localhost:5000/api/progress/weekly
```

### Get Language Statistics
```bash
curl http://localhost:5000/api/languages/stats
```

## 🏗️ Project Structure

```
backend/
├── data/
│   └── mockData.js          # Mock data storage
├── routes/
│   ├── profile.js           # Profile routes
│   ├── platforms.js         # Platform routes
│   ├── stats.js             # Statistics routes
│   ├── progress.js          # Progress routes
│   ├── languages.js         # Language routes
│   └── algorithms.js        # Algorithm routes
├── server.js                # Main server file
├── .env                     # Environment variables
├── .gitignore              # Git ignore file
├── package.json            # Dependencies
└── README.md               # Documentation
```

## 🔄 Integration with Frontend

The frontend can consume these APIs by updating the data fetching to call:

```javascript
// Instead of importing from dummyData.js
fetch('http://localhost:5000/api/profile')
  .then(res => res.json())
  .then(data => console.log(data))
```

## 🛠️ Future Enhancements

- Database integration (MongoDB/PostgreSQL)
- User authentication (JWT)
- Real-time data updates (WebSocket)
- Data validation middleware
- Rate limiting
- API documentation (Swagger/OpenAPI)
- Testing (Jest/Mocha)

## 📄 License

ISC
