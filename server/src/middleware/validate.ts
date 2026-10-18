import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ZodTypeAny, ZodError } from 'zod';

export interface ValidationSchema {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

export function validate(schema: ValidationSchema | ZodTypeAny): RequestHandler {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if ('parseAsync' in schema && typeof schema.parseAsync === 'function') {
        req.body = await schema.parseAsync(req.body);
        return next();
      }

      const compSchema = schema as ValidationSchema;

      if (compSchema.params) {
        req.params = (await compSchema.params.parseAsync(req.params)) as Record<string, string>;
      }
      if (compSchema.query) {
        req.query = (await compSchema.query.parseAsync(req.query)) as Record<string, unknown>;
      }
      if (compSchema.body) {
        req.body = await compSchema.body.parseAsync(req.body);
      }

      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return next(err);
      }
      next(err);
    }
  };
}

export default validate;
