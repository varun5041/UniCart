import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

export interface RequestValidationSchema {
  body?: AnyZodObject;
  query?: AnyZodObject;
  params?: AnyZodObject;
}

export function validate(schema: RequestValidationSchema | AnyZodObject) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if ('body' in schema || 'query' in schema || 'params' in schema) {
        const composite = schema as RequestValidationSchema;
        if (composite.body) {
          req.body = await composite.body.parseAsync(req.body);
        }
        if (composite.query) {
          req.query = await composite.query.parseAsync(req.query);
        }
        if (composite.params) {
          req.params = await composite.params.parseAsync(req.params);
        }
      } else {
        req.body = await (schema as AnyZodObject).parseAsync(req.body);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(error);
      } else {
        next(error);
      }
    }
  };
}

export default validate;
