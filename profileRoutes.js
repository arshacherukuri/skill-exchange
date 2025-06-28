const express = require("express");
const Profile = require("./Profile");
const auth = require("./authMiddleware");
const router = express.Router();

router.post("/", auth, async (req, res) => {
  const {
    name,
    email,
    contact,
    skillsOffered = [],
    skillsWanted = [],
    nativeLanguage = "",
    learningLanguages = [],
    tutoringSubjects = [],
    tutoringNeeds = [],
    bio,
  } = req.body;

  // Validation matching script.js createProfile
  if (!name || !email || !contact || !bio) {
    return res
      .status(400)
      .json({ message: "Name, Email, Contact, and Bio are required fields" });
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return res
      .status(400)
      .json({ message: "Please enter a valid email address" });
  }

  if (!/^\d{10}$/.test(contact)) {
    return res
      .status(400)
      .json({ message: "Invalid contact number. Must be exactly 10 digits" });
  }

  try {
    const existingProfile = await Profile.findOne({ email });
    if (existingProfile) {
      return res
        .status(400)
        .json({ message: "Profile with this email already exists" });
    }

    const profile = new Profile({
      user: req.userId,
      name,
      email,
      contact,
      skillsOffered: Array.isArray(skillsOffered)
        ? skillsOffered.map(s => s.trim())
        : skillsOffered
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s),
      skillsWanted: Array.isArray(skillsWanted)
        ? skillsWanted.map(s => s.trim())
        : skillsWanted
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s),
      nativeLanguage: nativeLanguage.trim(),
      learningLanguages: Array.isArray(learningLanguages)
        ? learningLanguages.map(l => l.trim())
        : learningLanguages
            .split(",")
            .map((l) => l.trim())
            .filter((l) => l),
      tutoringSubjects: Array.isArray(tutoringSubjects)
        ? tutoringSubjects.map(s => s.trim())
        : tutoringSubjects
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s),
      tutoringNeeds: Array.isArray(tutoringNeeds)
        ? tutoringNeeds.map(s => s.trim())
        : tutoringNeeds
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s),
      bio,
    });

    await profile.save();
    console.log(`Created new profile: ${email}`, profile);
    res.status(201).json(profile);
  } catch (error) {
    console.error("Error creating profile:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/", auth, async (req, res) => {
  try {
    const { email } = req.query;
    console.log("GET /api/profiles called with query:", { email });

    if (email) {
      const profile = await Profile.findOne({ email });
      if (!profile) {
        console.log(`No profile found for email: ${email}`);
        return res.status(200).json([]);
      }
      console.log(`Found profile for email: ${email}`, profile);
      return res.json([profile]);
    }

    const profiles = await Profile.find();
    console.log("Fetched all profiles:", profiles);
    res.json(profiles);
  } catch (error) {
    console.error("Error fetching profiles:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/me", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.userId });
    console.log(`Fetched user profile for userId: ${req.userId}`, profile || {});
    res.json(profile || {});
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/:id", auth, async (req, res) => {
  const {
    name,
    email,
    contact,
    skillsOffered,
    skillsWanted,
    nativeLanguage,
    learningLanguages,
    tutoringSubjects,
    tutoringNeeds,
    bio,
  } = req.body;

  // Validation matching script.js updateProfile
  if (!name || !email || !contact || !bio) {
    return res
      .status(400)
      .json({ message: "Name, Email, Contact, and Bio are required fields" });
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return res
      .status(400)
      .json({ message: "Please enter a valid email address" });
  }

  if (!/^\d{10}$/.test(contact)) {
    return res
      .status(400)
      .json({ message: "Invalid contact number. Must be exactly 10 digits" });
  }

  try {
    const profile = await Profile.findById(req.params.id);
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }
    if (profile.user.toString() !== req.userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const existingProfile = await Profile.findOne({
      email,
      _id: { $ne: req.params.id },
    });
    if (existingProfile) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const updatedProfile = await Profile.findByIdAndUpdate(
      req.params.id,
      {
        name,
        email,
        contact,
        skillsOffered: Array.isArray(skillsOffered)
          ? skillsOffered.map(s => s.trim())
          : skillsOffered
              .split(",")
              .map((s) => s.trim())
              .filter((s) => s),
        skillsWanted: Array.isArray(skillsWanted)
          ? skillsWanted.map(s => s.trim())
          : skillsWanted
              .split(",")
              .map((s) => s.trim())
              .filter((s) => s),
        nativeLanguage: nativeLanguage ? nativeLanguage.trim() : "",
        learningLanguages: Array.isArray(learningLanguages)
          ? learningLanguages.map(l => l.trim())
          : learningLanguages
              .split(",")
              .map((l) => l.trim())
              .filter((l) => l),
        tutoringSubjects: Array.isArray(tutoringSubjects)
          ? tutoringSubjects.map(s => s.trim())
          : tutoringSubjects
              .split(",")
              .map((s) => s.trim())
              .filter((s) => s),
        tutoringNeeds: Array.isArray(tutoringNeeds)
          ? tutoringNeeds.map(s => s.trim())
          : tutoringNeeds
              .split(",")
              .map((s) => s.trim())
              .filter((s) => s),
        bio,
      },
      { new: true }
    );

    console.log(`Updated profile: ${email}`, updatedProfile);
    res.json(updatedProfile);
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    const profile = await Profile.findById(req.params.id);
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }
    if (profile.user.toString() !== req.userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await Profile.findByIdAndDelete(req.params.id);
    console.log(`Deleted profile: ${profile.email}`);
    res.json({ message: "Profile deleted" });
  } catch (error) {
    console.error("Error deleting profile:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;