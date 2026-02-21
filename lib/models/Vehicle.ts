import mongoose, { Schema, Model } from 'mongoose';

export interface IVehicle {
    licensePlate: string;
    make: string;
    model: string;
    year: number;
    vehicleType: 'truck' | 'van' | 'car' | 'bus' | 'trailer';
    status: 'active' | 'maintenance' | 'retired';
    mileage: number;
    maxLoadCapacity: number;
    assignedDriver?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const vehicleSchema = new Schema<IVehicle>(
    {
        licensePlate: { type: String, required: true, unique: true, trim: true },
        make: { type: String, required: true, trim: true },
        model: { type: String, required: true, trim: true },
        year: { type: Number, required: true },
        vehicleType: {
            type: String,
            enum: ['truck', 'van', 'car', 'bus', 'trailer'],
            default: 'truck',
        },
        status: {
            type: String,
            enum: ['active', 'maintenance', 'retired'],
            default: 'active',
        },
        mileage: { type: Number, default: 0 },
        maxLoadCapacity: { type: Number, default: 0 },
        assignedDriver: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true }
);

export const Vehicle: Model<IVehicle> =
    mongoose.models.Vehicle || mongoose.model<IVehicle>('Vehicle', vehicleSchema);
