import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

mongoose.connect('mongodb://localhost:27017/grabandgo').then(async () => {
    const User = mongoose.model('User', new mongoose.Schema({ passwordHash: String }, { strict: false }));
    const hash = await bcrypt.hash('password123', 10);

    await User.updateMany(
        { email: { $in: ['riya@grabgo.app', 'logan@grabgo.app', 'amber@grabgo.app'] } },
        { $set: { passwordHash: hash } }
    );

    console.log('Passwords successfully updated to password123!');
    process.exit(0);
});
