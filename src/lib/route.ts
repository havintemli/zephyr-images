import { Request, Response } from "express";
import { ZodArray, ZodError, ZodObject } from "zod";

export const route = (
  schema: ZodObject<any> | ZodArray<any>,
  drawFunction: (...args: any[]) => Promise<Buffer>
) => {
  return async function handleRoute(request: Request, response: Response) {
    try {
      const query = schema.parse(request.body);

      const image = await drawFunction(query);

      response.status(200).contentType("image/png").send(image);
    } catch (e: unknown) {
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
