require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');
const User = require('./User');
const Profile = require('./Profile');
const authRoutes = require('./authRoutes');
const profileRoutes = require('./profileRoutes');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: 'http://localhost:8080' }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/myDatabase', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => {
        console.log('✅ Connected to MongoDB');
        initializeProfiles();
    })
    .catch(err => console.error('❌ Error connecting to MongoDB:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);

// Serve HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize Default and One-Time Profiles
const defaultProfiles = [
    {
        name: "Akshara",
        email: "akshara@example.com",
        contact: "1234567891",
        skillsOffered: ["Web Development", "Graphic Design", "SEO Optimization"],
        skillsWanted: ["Social Media Management", "Photography"],
        nativeLanguage: "Hindi",
        learningLanguages: ["Telugu", "Japanese"],
        tutoringSubjects: ["Mathematics", "HTML & CSS", "OOPs"],
        tutoringNeeds: ["Java Programming", "Computational Biology"],
        bio: "I'm Akshara, a web developer with a passion for design."
    },
    {
        name: "Rupasri",
        email: "chalasanirupasri234@gmail.com",
        contact: "1234567890",
        skillsOffered: ["animation"],
        skillsWanted: ["social media management"],
        nativeLanguage: "telugu",
        learningLanguages: ["french", "hindi"],
        tutoringSubjects: ["java programming", "HTML and CSS"],
        tutoringNeeds: ["animation"],
        bio: "I am Rupasri, pursuing my 3rd year in CSE at Mahindra University."
    }
];

const oneTimeProfiles = [
    {
        name: "Mokshi",
        email: "mokshi@example.com",
        contact: "1234567892",
        skillsOffered: ["Animation", "Content Writing"],
        skillsWanted: ["Web Development", "Copywriting", "Data Analysis"],
        nativeLanguage: "Telugu",
        learningLanguages: ["Hindi", "Mandarin"],
        tutoringSubjects: ["Discrete Maths", "Computational Biology"],
        tutoringNeeds: ["Software Engineering", "Mathematics", "Machine Learning"],
        bio: "Mokshi here, I love creating animations and writing content."
    },
    {
        name: "Pushpak",
        email: "pushpak@example.com",
        contact: "1234567893",
        skillsOffered: ["Social Media Management", "Copywriting"],
        skillsWanted: ["Animation", "Illustration"],
        nativeLanguage: "Telugu",
        learningLanguages: ["German", "Korean"],
        tutoringSubjects: ["Software Engineering", "Chemistry"],
        tutoringNeeds: ["Python", "Discrete Maths"],
        bio: "I'm Pushpak, skilled in social media and copywriting."
    },
    {
        name: "apurupa",
        email: "apurupa@example.com",
        contact: "1234567894",
        skillsOffered: ["Photography", "Writing"],
        skillsWanted: ["Animation", "Design"],
        nativeLanguage: "Telugu",
        learningLanguages: ["Japanese", "Korean"],
        tutoringSubjects: ["Physics", "English"],
        tutoringNeeds: ["Math", "Science"],
        bio: "I'm apurupa, passionate about photography."
    }
];

async function initializeProfiles() {
    try {
        // Create a default user for profiles if not exists
        const defaultUser = await User.findOne({ email: 'default@example.com' });
        let userId;
        if (!defaultUser) {
            const hashedPassword = await bcrypt.hash('defaultpassword', 10);
            const user = new User({
                name: 'Default User',
                email: 'default@example.com',
                password: hashedPassword
            });
            await user.save();
            userId = user._id;
            console.log('Created default user:', user.email);
        } else {
            userId = defaultUser._id;
        }

        // Initialize default profiles
        for (const profileData of defaultProfiles) {
            const exists = await Profile.findOne({ email: profileData.email });
            if (!exists) {
                await Profile.create({ ...profileData, user: userId });
                console.log(`Initialized default profile: ${profileData.email}`);
            }
        }

        // Initialize one-time profiles
        for (const profileData of oneTimeProfiles) {
            const exists = await Profile.findOne({ email: profileData.email });
            if (!exists) {
                await Profile.create({ ...profileData, user: userId });
                console.log(`Initialized one-time profile: ${profileData.email}`);
            }
        }
    } catch (error) {
        console.error('Error initializing profiles:', error);
    }
}

// Start Server
app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
});