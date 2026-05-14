import { z } from 'zod';

const mongoObjectIdRegex = /^[0-9a-f]{24}$/;
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const objectIdSchema = z
  .string()
  .refine(value => mongoObjectIdRegex.test(value) || uuidRegex.test(value), {
    message: 'Required',
  });
