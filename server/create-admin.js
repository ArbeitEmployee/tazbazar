const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = 'mongodb+srv://arbeittechnology_db_user:bow91ZyEFmO8Cmjz@cluster0.oy8cafs.mongodb.net/?appName=Cluster0';

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    const hash = await bcrypt.hash('Admin@1234', 10);
    const db = mongoose.connection.db;

    const existing = await db.collection('users').findOne({ email: 'admin@gmail.com' });
    if (existing) {
      await db.collection('users').updateOne(
        { email: 'admin@gmail.com' },
        { $set: { password: hash, userType: 'admin', isActive: true } }
      );
      console.log('Admin password updated! Email: admin@gmail.com | Password: Admin@1234');
    } else {
      await db.collection('users').insertOne({
        name: 'Admin',
        email: 'admin@gmail.com',
        password: hash,
        userType: 'admin',
        isActive: true,
        createdAt: new Date()
      });
      console.log('Admin created! Email: admin@gmail.com | Password: Admin@1234');
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
