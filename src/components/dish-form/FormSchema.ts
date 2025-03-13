
import * as z from "zod";

export const formSchema = z.object({
  name: z.string().min(2, { message: "Dish name must be at least 2 characters." }),
  cuisines: z.array(z.string()).min(1, { message: "Select at least one cuisine." }),
  sourceType: z.enum(["none", "url", "book"]),
  sourceValue: z.string().optional(),
  sourcePage: z.string().optional(),
  sourceId: z.string().optional(),
  location: z.string().optional(),
});

export type FormValues = z.infer<typeof formSchema>;
