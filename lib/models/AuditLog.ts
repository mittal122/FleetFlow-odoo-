import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAuditLog extends Document {
    userId: mongoose.Types.ObjectId;
    action: string;
    entityType: string;
    entityId: string;
    changes?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    status: 'success' | 'failure';
    createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        action: { type: String, required: true },
        entityType: { type: String, required: true },
        entityId: { type: String, required: true },
        changes: { type: Schema.Types.Mixed },
        ipAddress: { type: String },
        userAgent: { type: String },
        status: {
            type: String,
            enum: ['success', 'failure'],
            default: 'success',
        },
    },
    { timestamps: true }
);

export const AuditLog: Model<IAuditLog> =
    mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
