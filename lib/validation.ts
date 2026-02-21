import { z } from 'zod';

// Auth schemas
export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
});

// User schemas
export const createUserSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    role: z.enum(['admin', 'dispatcher', 'driver', 'mechanic', 'accountant', 'viewer']),
    phone: z.string().optional(),
});

export const updateUserSchema = z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    role: z.enum(['admin', 'dispatcher', 'driver', 'mechanic', 'accountant', 'viewer']).optional(),
    phone: z.string().optional(),
    status: z.enum(['active', 'inactive', 'suspended']).optional(),
});

// Vehicle schemas
export const createVehicleSchema = z.object({
    licensePlate: z.string().min(1, 'License plate is required'),
    make: z.string().min(1, 'Make is required'),
    model: z.string().min(1, 'Model is required'),
    year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
    status: z.enum(['active', 'maintenance', 'retired']).default('active'),
    mileage: z.number().min(0).default(0),
    assignedDriver: z.string().optional(),
});

// Trip schemas
export const createTripSchema = z.object({
    vehicle: z.string().min(1, 'Vehicle is required'),
    driver: z.string().min(1, 'Driver is required'),
    origin: z.string().min(1, 'Origin is required'),
    destination: z.string().min(1, 'Destination is required'),
    distance: z.number().min(0).optional(),
    scheduledDate: z.string().optional(),
    status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).default('scheduled'),
});

// Maintenance schemas
export const createMaintenanceSchema = z.object({
    vehicle: z.string().min(1, 'Vehicle is required'),
    type: z.enum(['oil_change', 'tire_replacement', 'brake_inspection', 'engine_service', 'general', 'other']),
    description: z.string().optional(),
    scheduledDate: z.string().min(1, 'Scheduled date is required'),
    status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).default('scheduled'),
    cost: z.number().min(0).optional(),
    mechanic: z.string().optional(),
});
