import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

export const ResetRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const VerifyEmailSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export const CompanySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  domain: z.string().url('Invalid website URL').or(z.string().length(0)).nullable().optional(),
  industry: z.string().nullable().optional(),
  size: z.string().nullable().optional(),
});

export const ContactSchema = z.object({
  name: z.string().min(1, 'Contact name is required'),
  email: z.string().email('Invalid email address').or(z.string().length(0)).nullable().optional(),
  phone: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  companyId: z.string().uuid().or(z.string().length(0)).nullable().optional(),
});

export const DealSchema = z.object({
  title: z.string().min(1, 'Deal title is required'),
  value: z.number().nonnegative('Value must be greater than or equal to 0'),
  stage: z.enum(['LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST']),
  probability: z.number().min(0).max(100, 'Probability must be between 0 and 100'),
  expectedCloseDate: z.string().datetime().or(z.string().length(0)).nullable().optional(),
  companyId: z.string().uuid().or(z.string().length(0)).nullable().optional(),
  contactId: z.string().uuid().or(z.string().length(0)).nullable().optional(),
});
