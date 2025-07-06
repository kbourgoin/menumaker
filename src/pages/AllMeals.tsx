import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout";
import { useMeals } from "@/hooks/useMeals";
import { sortDishes } from "@/utils/dishUtils";
import { SEOHead, getPageSEO } from "@/components/shared";
import {
  SearchAndFilterBar,
  ViewToggle,
  DishesLoading,
  DishesHeader,
  DishesDisplay,
} from "@/components/dishes";

const AllDishes = () => {
  const { dishes, isLoading } = useMeals();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("lastCooked");
  const [viewMode, setViewMode] = useState<"cards" | "table">("table");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Initialize selected tags from URL params
  useEffect(() => {
    const tagFromUrl = searchParams.get("tag");
    if (tagFromUrl && !selectedTags.includes(tagFromUrl)) {
      setSelectedTags([tagFromUrl]);
    }
  }, [searchParams, selectedTags]);

  // Scroll to top when navigating to filtered page
  useEffect(() => {
    const tagFromUrl = searchParams.get("tag");
    if (tagFromUrl) {
      window.scrollTo(0, 0);
    }
  }, [searchParams]);

  // Update URL when tags change (but only if navigated from tag click)
  const handleTagsChange = useCallback(
    (tags: string[]) => {
      setSelectedTags(tags);
      // Remove tag param from URL when no tags are selected
      if (tags.length === 0) {
        searchParams.delete("tag");
        setSearchParams(searchParams);
      }
    },
    [searchParams, setSearchParams]
  );

  // Memoized unique dishes to avoid recalculating on every render
  const uniqueDishes = useMemo(() => {
    if (!dishes || !Array.isArray(dishes)) {
      return [];
    }

    // Deduplicate dishes by ID to fix any duplicate key issues
    return dishes.reduce(
      (acc, dish) => {
        if (!acc.some(existing => existing.id === dish.id)) {
          acc.push(dish);
        }
        return acc;
      },
      [] as typeof dishes
    );
  }, [dishes]);

  // Memoized filtered and sorted dishes
  const filteredDishes = useMemo(() => {
    const filtered = uniqueDishes.filter(dish => {
      if (!dish || typeof dish !== "object") {
        return false;
      }

      // Text search filter
      const matchesSearch =
        !searchQuery ||
        (dish.name &&
          dish.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (dish.cuisines &&
          Array.isArray(dish.cuisines) &&
          dish.cuisines.some(
            cuisine =>
              cuisine &&
              cuisine.toLowerCase().includes(searchQuery.toLowerCase())
          ));

      // Tag filter (includes both general tags and cuisines)
      const matchesTags =
        selectedTags.length === 0 ||
        selectedTags.every(selectedTag => {
          // Check if tag exists in dish tags
          const matchesTag = dish.tags && dish.tags.includes(selectedTag);
          // Check if tag exists in dish cuisines
          const matchesCuisine =
            dish.cuisines && dish.cuisines.includes(selectedTag);
          return matchesTag || matchesCuisine;
        });

      return matchesSearch && matchesTags;
    });

    // Only sort for cards view - table view handles its own sorting
    return viewMode === "cards" ? sortDishes(filtered, sortOption) : filtered;
  }, [uniqueDishes, searchQuery, selectedTags, viewMode, sortOption]);

  return (
    <Layout>
      <SEOHead {...getPageSEO("all-meals")} />
      <div className="mb-8 animate-slide-down">
        <DishesHeader />

        <SearchAndFilterBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          sortOption={sortOption}
          setSortOption={setSortOption}
          selectedTags={selectedTags}
          setSelectedTags={handleTagsChange}
          viewMode={viewMode}
        />

        <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />

        {isLoading ? (
          <DishesLoading />
        ) : (
          <DishesDisplay
            dishes={dishes}
            filteredDishes={filteredDishes}
            viewMode={viewMode}
            isLoading={isLoading}
            sortOption={sortOption}
            setSortOption={setSortOption}
          />
        )}

        {dishes && dishes.length > 0 && (
          <div className="mt-6 text-sm text-muted-foreground">
            Showing {filteredDishes.length} of {dishes.length} dishes
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AllDishes;
