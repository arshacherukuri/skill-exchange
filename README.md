Install Dependencies:

Backend:cd src/server npm install

Frontend (if using npm for static assets):cd src/client npm install

Set Up MongoDB: Start a local MongoDB instance:mongod

Alternatively, use MongoDB Atlas: Create a free cluster at MongoDB Atlas. Obtain the connection string (e.g., mongodb+srv://:@cluster0.mongodb.net/skillsync).

Configure Environment Variables:

Create a .env file in src/server:PORT=3000 MONGODB_URI=mongodb://localhost:27017/skillsync JWT_SECRET=your_jwt_secret_here

Replace MONGODB_URI with your Atlas connection string if using Atlas. Use a secure JWT_SECRET (e.g., a random 32-character string).

Run the Backend: cd src/server npm start

The server will run at http://localhost:3000.

Run the Frontend: Use a static server for the client:cd src/client npx http-server

Alternatively, open src/client/index.html directly in a browser (some features may require a server due to CORS). Access the app at http://localhost:8080 (port may vary; check terminal output).

Test the Application:

Navigate to http://localhost:8080. Register a user (e.g., apple@gmail.com, password: test123). Create a profile with skills (e.g., offer JavaScript, seek Python). Explore the dashboard to view matches and edit your profile. Test read-only mode by selecting another user’s profile (e.g., banana@gmail.com).

Troubleshooting

MongoDB Connection Errors: Ensure MongoDB is running (mongod) or check your Atlas connection string. CORS Issues: Use http-server instead of opening index.html directly. JWT Errors: Verify JWT_SECRET matches in .env and is secure. Port Conflicts: Change PORT in .env if 3000 is in use.

Demo Video Watch our application running locally with a detailed code walkthrough:Demo VideoThis video demonstrates:

Setting up the project (cloning, installing, running). Key features: user registration, profile creation, match browsing, profile editing. Code explanation: frontend (script.js), backend (server.js), and configuration (.env).

Note: Replace the URL with the actual Google Drive or YouTube link after uploading the demo video. Documentation The following documents are included in the docs/ directory:
