import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    role: 'admin' | 'dispatcher' | 'driver' | 'mechanic' | 'accountant' | 'viewer';
    phone?: string;
    status: 'active' | 'inactive' | 'suspended';
    lastLogin?: Date;
    licenseNumber?: string;
    licenseExpiry?: Date;
    safetyScore?: number;
    complaints?: number;
    createdAt: Date;
    updatedAt: Date;
}

const userSchema = new Schema<IUser>(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        password: { type: String, required: true },
        role: {
            type: String,
            enum: ['admin', 'dispatcher', 'driver', 'mechanic', 'accountant', 'viewer'],
            default: 'viewer',
        },
        phone: { type: String, trim: true },
        status: {
            type: String,
            enum: ['active', 'inactive', 'suspended'],
            default: 'active',
        },
        lastLogin: { type: Date },
        licenseNumber: { type: String, trim: true },
        licenseExpiry: { type: Date },
        safetyScore: { type: Number, min: 0, max: 100, default: 100 },
        complaints: { type: Number, default: 0 },
    },
    { timestamps: true }
);

export const User: Model<IUser> =
    mongoose.models.User || mongoose.model<IUser>('User', userSchema);
