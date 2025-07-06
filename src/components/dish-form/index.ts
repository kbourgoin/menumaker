// Export the main DishForm component as the default export
import DishForm from "./DishForm";
export default DishForm;
export { default as DishForm } from "./DishForm";

// Re-export other components if they need to be used elsewhere
export { default as CuisineSelector } from "./CuisineSelector";
export { default as SourceSelector } from "./SourceSelector";
export { default as LocationField } from "./LocationField";
export { formSchema } from "./FormSchema";
export type { FormValues } from "./FormSchema";
