const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

// Load environment variables
dotenv.config();

const predefinedSkills = [
  'JavaScript', 'Python', 'React', 'Node.js', 'Graphic Design',
  'UI/UX Design', 'Digital Marketing', 'Piano', 'Guitar', 'Spanish',
  'French', 'Cooking', 'Photography', 'Video Editing', 'Public Speaking'
];

const mockUsers = [
  {
    username: 'alex_coder',
    email: 'alex@example.com',
    password: 'password123',
    bio: 'Full stack developer looking to learn design.',
    skillsOffered: ['JavaScript', 'React', 'Node.js'],
    skillsSought: ['UI/UX Design', 'Graphic Design'],
    location: { city: 'San Francisco', country: 'United States' },
    availability: ['weekday_evening', 'weekend_morning']
  },
  {
    username: 'sarah_designer',
    email: 'sarah@example.com',
    password: 'password123',
    bio: 'Creative designer wanting to learn to code.',
    skillsOffered: ['UI/UX Design', 'Graphic Design', 'Photography'],
    skillsSought: ['JavaScript', 'React'],
    location: { city: 'New York', country: 'United States' },
    availability: ['weekday_afternoon', 'weekend_afternoon']
  },
  {
    username: 'music_mike',
    email: 'mike@example.com',
    password: 'password123',
    bio: 'Musician who wants to learn Spanish.',
    skillsOffered: ['Piano', 'Guitar', 'Music Theory'],
    skillsSought: ['Spanish'],
    location: { city: 'Austin', country: 'United States' },
    availability: ['weekend_evening']
  },
  {
    username: 'julia_polyglot',
    email: 'julia@example.com',
    password: 'password123',
    bio: 'Language lover looking for music lessons.',
    skillsOffered: ['Spanish', 'French', 'English'],
    skillsSought: ['Piano'],
    location: { city: 'London', country: 'United Kingdom' },
    availability: ['weekday_morning']
  },
  {
    username: 'chen_cooks',
    email: 'chen@example.com',
    password: 'password123',
    bio: 'Chef looking for digital marketing help.',
    skillsOffered: ['Cooking', 'Baking', 'Knife Skills'],
    skillsSought: ['Digital Marketing'],
    location: { city: 'Toronto', country: 'Canada' },
    availability: ['weekday_afternoon']
  },
  {
    username: 'fuzzy_matcher',
    email: 'fuzzy@example.com',
    password: 'password123',
    bio: 'I have a custom skill that is slightly misspelled.',
    skillsOffered: ['Javscript'], // Misspelled JavaScript
    skillsSought: ['Pyton'], // Misspelled Python
    location: { city: 'Remote', country: 'Internet' },
    availability: ['weekend_morning']
  }
];

const seedDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/SkillSwapDB';
    await mongoose.connect(mongoURI);
    console.log('MongoDB Connected...');

    // Clear existing users
    await User.deleteMany({});
    console.log('Users cleared.');

    // Hash passwords and save users
    for (const user of mockUsers) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(user.password, salt);
      await User.create(user);
    }

    console.log(`Seeded ${mockUsers.length} users.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedDB();
