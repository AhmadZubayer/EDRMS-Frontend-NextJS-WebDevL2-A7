import { z } from 'zod';

export const missingPersonSchema = () =>
  z.object({
    fullName: z.string().trim().min(2, 'Full name must contain at least 2 characters').max(120),
    age: z
      .string()
      .trim()
      .min(1, 'Age is required')
      .refine((val) => Number.isInteger(Number(val)) && Number(val) >= 0 && Number(val) <= 130, {
        message: 'Age must be a whole number between 0 and 130',
      }),
    gender: z.string().trim().min(1, 'Gender is required').max(30),
    lastSeenLocation: z.string().trim().min(2, 'Last seen location is required').max(255),
    lastSeenDate: z.string().min(1, 'Last seen date is required').refine((value) => !Number.isNaN(Date.parse(value)), 'Invalid last seen date'),
    contactPhone: z.string().trim().min(6, 'Invalid contact phone').max(20, 'Invalid contact phone').optional(),
    description: z.string().trim().min(5, 'Description must contain at least 5 characters').max(2000),
  });
