import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITrip extends Document {
    tripNumber: string;
    vehicle: mongoose.Types.ObjectId;
    driver: mongoose.Types.ObjectId;
    origin: string;
    destination: string;
    distance?: number;
    scheduledDate?: Date;
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const tripSchema = new Schema<ITrip>(
    {
        tripNumber: { type: String, required: true, unique: true },
        vehicle: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true },
        driver: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        origin: { type: String, required: true, trim: true },
        destination: { type: String, required: true, trim: true },
        distance: { type: Number },
        scheduledDate: { type: Date },
        status: {
            type: String,
            enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
            default: 'scheduled',
        },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true }
);

export const Trip: Model<ITrip> =
    mongoose.models.Trip || mongoose.model<ITrip>('Trip', tripSchema);
