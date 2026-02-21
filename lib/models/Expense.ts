import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IExpense extends Document {
    trip: mongoose.Types.ObjectId;
    driver: mongoose.Types.ObjectId;
    vehicle?: mongoose.Types.ObjectId;
    fuelCost: number;
    miscExpenses: number;
    totalCost: number;
    notes?: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: Date;
    updatedAt: Date;
}

const expenseSchema = new Schema<IExpense>(
    {
        trip: { type: Schema.Types.ObjectId, ref: 'Trip', required: true },
        driver: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        vehicle: { type: Schema.Types.ObjectId, ref: 'Vehicle' },
        fuelCost: { type: Number, required: true, default: 0 },
        miscExpenses: { type: Number, default: 0 },
        totalCost: { type: Number, required: true, default: 0 },
        notes: { type: String, trim: true },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
        },
    },
    { timestamps: true }
);

export const Expense: Model<IExpense> =
    mongoose.models.Expense || mongoose.model<IExpense>('Expense', expenseSchema);
