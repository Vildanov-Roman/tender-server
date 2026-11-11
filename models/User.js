import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    phone: { type: String, default: '' },
    avatarUrl: { type: String, default: '' },
    directions: [{ type: String }], // Массив строк (направлений)
    participatingTenders: [{
        tenderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tender' },
        status: { type: String, default: 'saved' },
        dateAdded: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

export default mongoose.model('User', UserSchema);