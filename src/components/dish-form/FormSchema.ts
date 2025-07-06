import * as z from "zod";

export const formSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Dish name must be at least 2 characters." }),
  cuisines: z.array(z.string()).min(1, { message: "Select a cuisine." }),
  sourceId: z.string().optional(),
  location: z
    .string()
    .optional()
    .describe(
      "The specific location in the source (e.g., page number, URL section)"
    ),
  tags: z.array(z.string()).optional().default([]),
});

export type FormValues = z.infer<typeof formSchema>;
