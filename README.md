# Learning Path Finder

A personalized learning platform that creates customized learning paths using AI to help users achieve their educational goals.

## 🚀 Features

- **Personalized Learning Paths**: AI-generated custom learning plans
- **Progress Tracking**: Monitor your learning journey
- **Skill Assessment**: Evaluate your current skill level
- **Certificate Generation**: Earn certificates upon completion
- **Resource Recommendations**: Curated learning materials
- **Interactive Dashboard**: Track progress and manage learning

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose
- **JWT** Authentication
- **Google Gemini AI** for content generation
- **Puppeteer** for PDF generation

### Frontend
- **React.js** with React Router
- **Axios** for API communication
- **Context API** for state management
- **CSS3** with responsive design

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB database
- Google Gemini API key

### Getting Your Gemini API Key:
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the API key (it will look like: `AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)
5. Add it to your `.env` file as `GEMINI_API_KEY=YOUR_COPIED_KEY`

## 🚀 Installation

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
Create a `.env` file in the backend directory with:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/learning-path-finder
JWT_SECRET=your_super_secret_jwt_key_here
GEMINI_API_KEY=YOUR_ACTUAL_GEMINI_API_KEY_HERE
CLIENT_URL=http://localhost:3000
```

**Example .env file:**
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/learning-path-finder
JWT_SECRET=mySecretKey123!@#
GEMINI_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CLIENT_URL=http://localhost:3000
```

4. Start the backend server:
```bash
npm start
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
Create a `.env` file in the frontend directory with:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

**Example frontend .env file:**
```env
REACT_APP_API_URL=http://localhost:5000/api
```

4. Start the frontend development server:
```bash
npm start
```

## 🎯 Usage

1. Open your browser and navigate to `http://localhost:3000`
2. Register for a new account or login
3. Complete the initial skill assessment
4. Select your learning domain and goals
5. Follow your personalized learning path
6. Track progress and earn certificates

## 📁 Project Structure

```
learning-path-finder/
├── backend/
│   ├── controllers/     # Request handlers
│   ├── models/         # Database schemas
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── middleware/     # Custom middleware
│   └── config/         # Configuration files
├── frontend/
│   ├── public/         # Static files
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── pages/      # Page components
│   │   ├── context/    # Context providers
│   │   └── services/   # API services
└── README.md
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Learning Paths
- `GET /api/paths` - Get user learning paths
- `POST /api/paths` - Create new learning path
- `PUT /api/paths/:id` - Update learning path

### Certificates
- `POST /api/certificates/generate` - Generate certificate
- `GET /api/certificates` - Get user certificates
- `GET /api/certificates/:id/pdf` - Download certificate PDF

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/AmazingFeature`
3. Commit your changes: `git commit -m 'Add some AmazingFeature'`
4. Push to the branch: `git push origin feature/AmazingFeature`
5. Open a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues or have questions, please file an issue on the GitHub repository.

## 🙏 Acknowledgments

- Google Gemini AI for content generation
- MongoDB for database services
- React community for excellent documentation
