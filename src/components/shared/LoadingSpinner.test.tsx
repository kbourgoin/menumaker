import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/test-utils";
import LoadingSpinner from "./LoadingSpinner";

describe("LoadingSpinner", () => {
  it("renders with default props", () => {
    render(<LoadingSpinner />);

    // Should render a loading spinner (using Loader2 icon)
    const spinner = document.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });

  it("renders with text when provided", () => {
    const text = "Loading dishes...";
    render(<LoadingSpinner text={text} />);

    expect(screen.getByText(text)).toBeInTheDocument();
  });

  it("applies correct size classes", () => {
    const { rerender } = render(<LoadingSpinner size="sm" />);
    let spinner = document.querySelector(".animate-spin");
    expect(spinner).toHaveClass("h-4", "w-4");

    rerender(<LoadingSpinner size="md" />);
    spinner = document.querySelector(".animate-spin");
    expect(spinner).toHaveClass("h-8", "w-8");

    rerender(<LoadingSpinner size="lg" />);
    spinner = document.querySelector(".animate-spin");
    expect(spinner).toHaveClass("h-12", "w-12");
  });

  it("applies custom className", () => {
    const customClass = "text-red-500";
    render(<LoadingSpinner className={customClass} />);

    const spinner = document.querySelector(".animate-spin");
    expect(spinner).toHaveClass(customClass);
  });

  it("renders with both text and spinner when text is provided", () => {
    const text = "Loading...";
    render(<LoadingSpinner text={text} />);

    expect(screen.getByText(text)).toBeInTheDocument();
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });
});
