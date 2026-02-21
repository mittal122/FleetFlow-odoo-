import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMaintenance extends Document {
    vehicle: mongoose.Types.ObjectId;
    type: 'oil_change' | 'tire_replacement' | 'brake_inspection' | 'engine_service' | 'general' | 'other';
    description?: string;
    scheduledDate: Date;
    completedDate?: Date;
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    cost?: number;
    mechanic?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const maintenanceSchema = new Schema<IMaintenance>(
    {
        vehicle: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true },
        type: {
            type: String,
            enum: ['oil_change', 'tire_replacement', 'brake_inspection', 'engine_service', 'general', 'other'],
            required: true,
        },
        description: { type: String, trim: true },
        scheduledDate: { type: Date, required: true },
        completedDate: { type: Date },
        status: {
            type: String,
            enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
            default: 'scheduled',
        },
        cost: { type: Number },
        mechanic: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true }
);

export const Maintenance: Model<IMaintenance> =
    mongoose.models.Maintenance || mongoose.model<IMaintenance>('Maintenance', maintenanceSchema);
