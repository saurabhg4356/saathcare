import { ZodError } from 'zod';

/**
 * Higher-order middleware to validate incoming request data using Zod
 * @param {import('zod').ZodSchema} schema 
 * @param {'body' | 'query' | 'params'} [target='body']
 */
export function validate(schema, target = 'body') {
  return async (req, res, next) => {
    try {
      const parsed = await schema.parseAsync(req[target]);
      req[target] = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next(error);
      }
      next(error);
    }
  };
}
