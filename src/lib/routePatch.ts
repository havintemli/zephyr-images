import { Request, Response } from "express";
import { ZodError, z } from "zod";

export const routePatch = (
  getFunction: (id: number, useCache: boolean) => Promise<string>
) => {
  return async function handleRoute(request: Request, response: Response) {
    try {
      const query = z.coerce.number().positive().parse(request.params.id);

      await getFunction(query, false);

      response.status(204).send();
    } catch (e: unknown) {
      console.log(e);
      if (e instanceof ZodError) {
        const errors = e.errors;
        response.status(400).json({
          errors,
        });
      } else {
        console.error(e);

        response
          .status(500)
          .json({ errors: [{ message: "An unexpected error occurred." }] });
      }
    }
  };
};
