import { Request, Response } from "express";
import { ZodArray, ZodError, ZodObject } from "zod";

export const route = (
  schema: ZodObject<any> | ZodArray<any>,
  drawFunction: (...args: any[]) => Promise<Buffer | string>
) => {
  return async function handleRoute(request: Request, response: Response) {
    try {
      const query = schema.parse(request.body);

      const image = await drawFunction(query);

      if (image instanceof Buffer) {
        response.status(200).contentType("image/png").send(image);

        return;
      } else {
        response
          .status(200)
          .contentType("application/json")
          .send(JSON.stringify({ url: image }));

        return;
      }
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
