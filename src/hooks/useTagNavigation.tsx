import { useNavigate } from "react-router-dom";

export const useTagNavigation = () => {
  const navigate = useNavigate();

  const navigateToTag = (tagName: string) => {
    // Navigate to AllMeals page with tag filter
    // We'll use URL search params to pass the selected tag
    const searchParams = new URLSearchParams();
    searchParams.set('tag', tagName);
    navigate(`/all-meals?${searchParams.toString()}`);
  };

  return { navigateToTag };
};