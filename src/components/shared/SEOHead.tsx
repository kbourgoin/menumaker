import { useEffect } from "react";
import { useLocation } from "react-router-dom";

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
}

const SEOHead: React.FC<SEOHeadProps> = ({
  title = "MenuMaker - Your Family Meal Memory Keeper",
  description = "Track your family meals, discover new recipes, and keep a history of your culinary adventures with MenuMaker.",
  keywords = "meal planning, recipe tracking, family meals, cooking history, meal manager",
  image = "/og-image.png",
  url,
}) => {
  const location = useLocation();
  const currentUrl = url || `${window.location.origin}${location.pathname}`;

  useEffect(() => {
    // Update document title
    document.title = title;

    // Update meta tags
    const updateMetaTag = (name: string, content: string) => {
      let element = document.querySelector(
        `meta[name="${name}"]`
      ) as HTMLMetaElement;
      if (!element) {
        element = document.createElement("meta");
        element.name = name;
        document.head.appendChild(element);
      }
      element.content = content;
    };

    const updatePropertyTag = (property: string, content: string) => {
      let element = document.querySelector(
        `meta[property="${property}"]`
      ) as HTMLMetaElement;
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute("property", property);
        document.head.appendChild(element);
      }
      element.content = content;
    };

    // Basic meta tags
    updateMetaTag("description", description);
    updateMetaTag("keywords", keywords);

    // Open Graph tags
    updatePropertyTag("og:title", title);
    updatePropertyTag("og:description", description);
    updatePropertyTag("og:image", image);
    updatePropertyTag("og:url", currentUrl);
    updatePropertyTag("og:type", "website");
    updatePropertyTag("og:site_name", "MenuMaker");

    // Twitter Card tags
    updateMetaTag("twitter:card", "summary_large_image");
    updateMetaTag("twitter:title", title);
    updateMetaTag("twitter:description", description);
    updateMetaTag("twitter:image", image);

    // Canonical URL
    let canonicalLink = document.querySelector(
      'link[rel="canonical"]'
    ) as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.rel = "canonical";
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = currentUrl;
  }, [title, description, keywords, image, currentUrl]);

  return null; // This component doesn't render anything
};

export default SEOHead;

// Helper function to generate page-specific SEO data
// eslint-disable-next-line react-refresh/only-export-components
export const getPageSEO = (page: string, data?: { dishName?: string }) => {
  const seoData: SEOHeadProps = {};

  switch (page) {
    case "home":
      seoData.title = "MenuMaker - Your Family Meal Memory Keeper";
      seoData.description =
        "Track your family meals, discover new recipes, and keep a history of your culinary adventures with MenuMaker.";
      break;

    case "all-meals":
      seoData.title = "All Dishes - MenuMaker";
      seoData.description =
        "Browse and manage all your family dishes and recipes in one place.";
      break;

    case "add-meal":
      seoData.title = "Add New Dish - MenuMaker";
      seoData.description = "Add a new dish to your family recipe collection.";
      break;

    case "weekly-menu":
      seoData.title = "Weekly Menu - MenuMaker";
      seoData.description =
        "Plan your weekly meals with AI-powered suggestions based on your cooking history.";
      break;

    case "settings":
      seoData.title = "Settings - MenuMaker";
      seoData.description = "Manage your account settings and preferences.";
      break;

    case "meal-detail":
      if (data?.dishName) {
        seoData.title = `${data.dishName} - MenuMaker`;
        seoData.description = `View details, cooking history, and notes for ${data.dishName}.`;
      }
      break;

    default:
      break;
  }

  return seoData;
};
