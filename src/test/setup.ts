import "@testing-library/jest-dom";
import { beforeAll, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Mock environment variables
beforeAll(() => {
  // Mock window.location for tests
  Object.defineProperty(window, "location", {
    value: {
      origin: "http://localhost:3000",
      pathname: "/",
      search: "",
      hash: "",
      href: "http://localhost:3000/",
      reload: () => {},
    },
    writable: true,
  });

  // Mock matchMedia for components that use it
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => {},
    }),
  });

  // Mock ResizeObserver
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  // Mock IntersectionObserver
  global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

// Cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
});
