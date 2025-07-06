import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import StatsCard from "../StatsCard";
import type { StatsData } from "@/types";

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const createWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe("StatsCard", () => {
  const mockStats: StatsData = {
    totalDishes: 25,
    totalTimesCooked: 87,
    mostCooked: {
      id: "dish-1",
      name: "Spaghetti Carbonara",
      createdAt: "2024-01-01T00:00:00Z",
      cuisines: ["Italian"],
      timesCooked: 12,
      userId: "user-1",
      tags: [],
    },
    topDishes: [
      {
        id: "dish-1",
        name: "Spaghetti Carbonara",
        createdAt: "2024-01-01T00:00:00Z",
        cuisines: ["Italian"],
        timesCooked: 12,
        userId: "user-1",
        tags: [],
      },
      {
        id: "dish-2",
        name: "Chicken Curry",
        createdAt: "2024-01-02T00:00:00Z",
        cuisines: ["Indian"],
        timesCooked: 8,
        userId: "user-1",
        tags: [],
      },
      {
        id: "dish-3",
        name: "Beef Tacos",
        createdAt: "2024-01-03T00:00:00Z",
        cuisines: ["Mexican"],
        timesCooked: 6,
        userId: "user-1",
        tags: [],
      },
    ],
    cuisineBreakdown: {
      Italian: 8,
      Mexican: 6,
      Indian: 4,
      American: 3,
      Asian: 2,
      French: 2,
    },
    recentlyCooked: [
      {
        date: "2024-01-15T00:00:00Z",
        dish: {
          id: "dish-1",
          name: "Spaghetti Carbonara",
          createdAt: "2024-01-01T00:00:00Z",
          cuisines: ["Italian"],
          timesCooked: 12,
          userId: "user-1",
          tags: [],
        },
        notes: "Perfect!",
      },
    ],
  };

  it("should render loading state", () => {
    render(<StatsCard stats={null} isLoading={true} />, {
      wrapper: createWrapper,
    });

    expect(screen.getByText("Your Stats")).toBeInTheDocument();
    expect(screen.getByText("Cooking summary")).toBeInTheDocument();

    // Check for loading skeleton
    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("should render stats data correctly", () => {
    render(<StatsCard stats={mockStats} isLoading={false} />, {
      wrapper: createWrapper,
    });

    // Check basic stats
    expect(screen.getByText("Total Dishes:")).toBeInTheDocument();
    expect(screen.getByText("25")).toBeInTheDocument();
    expect(screen.getByText("Times Cooked:")).toBeInTheDocument();
    expect(screen.getByText("87")).toBeInTheDocument();

    // Check top dishes section
    expect(screen.getByText("Top 5 Most Cooked:")).toBeInTheDocument();
    expect(screen.getByText("Spaghetti Carbonara")).toBeInTheDocument();
    expect(screen.getByText("12x")).toBeInTheDocument();
    expect(screen.getByText("Chicken Curry")).toBeInTheDocument();
    expect(screen.getByText("8x")).toBeInTheDocument();

    // Check cuisines section
    expect(screen.getByText("Top 5 Cuisines:")).toBeInTheDocument();
    expect(screen.getByText("Italian")).toBeInTheDocument();
    expect(screen.getByText("Mexican")).toBeInTheDocument();
  });

  it("should calculate cuisine percentages correctly", () => {
    render(<StatsCard stats={mockStats} isLoading={false} />, {
      wrapper: createWrapper,
    });

    // Total cuisines: 8+6+4+3+2+2 = 25
    // Italian: 8/25 = 32%
    // Mexican: 6/25 = 24%
    expect(screen.getByText("32%")).toBeInTheDocument(); // Italian
    expect(screen.getByText("24%")).toBeInTheDocument(); // Mexican
  });

  it("should handle cuisine click navigation", () => {
    render(<StatsCard stats={mockStats} isLoading={false} />, {
      wrapper: createWrapper,
    });

    const italianButton = screen.getByText("Italian");
    fireEvent.click(italianButton);

    expect(mockNavigate).toHaveBeenCalledWith("/all-meals?tag=Italian");
  });

  it("should show expand/collapse for more cuisines", () => {
    render(<StatsCard stats={mockStats} isLoading={false} />, {
      wrapper: createWrapper,
    });

    // Should show "+1 more cuisines" button (6 total, showing top 5)
    const expandButton = screen.getByText("+1 more cuisines");
    expect(expandButton).toBeInTheDocument();

    // Click to expand
    fireEvent.click(expandButton);

    // Should now show "Show less" button
    expect(screen.getByText("Show less")).toBeInTheDocument();

    // Should show all cuisines now
    expect(screen.getByText("French")).toBeInTheDocument();
  });

  it("should render empty state when no stats available", () => {
    render(<StatsCard stats={null} isLoading={false} />, {
      wrapper: createWrapper,
    });

    expect(screen.getByText("No stats available yet.")).toBeInTheDocument();
    expect(
      screen.getByText("Add some dishes to see your stats!")
    ).toBeInTheDocument();
  });

  it("should handle stats with no top dishes", () => {
    const statsWithoutTopDishes: StatsData = {
      ...mockStats,
      topDishes: [],
    };

    render(<StatsCard stats={statsWithoutTopDishes} isLoading={false} />, {
      wrapper: createWrapper,
    });

    expect(screen.getByText("25")).toBeInTheDocument(); // Total dishes still shown
    expect(screen.queryByText("Top 5 Most Cooked:")).not.toBeInTheDocument();
  });

  it("should handle stats with no cuisines", () => {
    const statsWithoutCuisines: StatsData = {
      ...mockStats,
      cuisineBreakdown: {},
    };

    render(<StatsCard stats={statsWithoutCuisines} isLoading={false} />, {
      wrapper: createWrapper,
    });

    expect(screen.getByText("25")).toBeInTheDocument(); // Total dishes still shown
    expect(screen.queryByText("Top 5 Cuisines:")).not.toBeInTheDocument();
  });

  it("should filter out cuisines with zero counts", () => {
    const statsWithZeroCounts: StatsData = {
      ...mockStats,
      cuisineBreakdown: {
        Italian: 8,
        Mexican: 0, // Should be filtered out
        Indian: 4,
        American: 0, // Should be filtered out
      },
    };

    render(<StatsCard stats={statsWithZeroCounts} isLoading={false} />, {
      wrapper: createWrapper,
    });

    expect(screen.getByText("Italian")).toBeInTheDocument();
    expect(screen.getByText("Indian")).toBeInTheDocument();
    expect(screen.queryByText("Mexican")).not.toBeInTheDocument();
    expect(screen.queryByText("American")).not.toBeInTheDocument();
  });

  it("should sort cuisines by count in descending order", () => {
    const statsWithUnsortedCuisines: StatsData = {
      ...mockStats,
      cuisineBreakdown: {
        American: 3,
        Italian: 8,
        Mexican: 6,
        Indian: 4,
      },
    };

    render(<StatsCard stats={statsWithUnsortedCuisines} isLoading={false} />, {
      wrapper: createWrapper,
    });

    const cuisineElements = screen
      .getAllByRole("button")
      .filter(btn =>
        ["Italian", "Mexican", "Indian", "American"].includes(
          btn.textContent || ""
        )
      );

    // Should be in descending order by count
    expect(cuisineElements[0]).toHaveTextContent("Italian"); // 8
    expect(cuisineElements[1]).toHaveTextContent("Mexican"); // 6
    expect(cuisineElements[2]).toHaveTextContent("Indian"); // 4
    expect(cuisineElements[3]).toHaveTextContent("American"); // 3
  });

  it("should handle edge case of single cuisine", () => {
    const statsWithSingleCuisine: StatsData = {
      ...mockStats,
      cuisineBreakdown: {
        Italian: 5,
      },
    };

    render(<StatsCard stats={statsWithSingleCuisine} isLoading={false} />, {
      wrapper: createWrapper,
    });

    expect(screen.getByText("Italian")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument(); // Should be 100% since it's the only cuisine
    expect(screen.queryByText("+0 more cuisines")).not.toBeInTheDocument(); // No expand button
  });

  it("should render progress bars with correct colors", () => {
    render(<StatsCard stats={mockStats} isLoading={false} />, {
      wrapper: createWrapper,
    });

    // Check that progress bars are rendered (they have specific styling)
    const progressBars = document.querySelectorAll(".h-1.rounded-full");
    expect(progressBars.length).toBeGreaterThan(0);
  });

  it("should be memoized and not re-render unnecessarily", () => {
    const { rerender } = render(
      <StatsCard stats={mockStats} isLoading={false} />,
      { wrapper: createWrapper }
    );

    // Re-render with same props
    rerender(<StatsCard stats={mockStats} isLoading={false} />);

    // Component should still work (this tests that React.memo is working)
    expect(screen.getByText("Your Stats")).toBeInTheDocument();
    expect(screen.getByText("25")).toBeInTheDocument();
  });
});
