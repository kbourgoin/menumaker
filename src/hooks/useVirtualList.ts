import { useState, useEffect, useRef, useCallback } from "react";

interface VirtualListOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

interface VirtualListResult {
  scrollElementRef: React.RefObject<HTMLDivElement>;
  items: Array<{
    index: number;
    style: React.CSSProperties;
  }>;
  totalHeight: number;
}

export function useVirtualList<T>(
  items: T[],
  options: VirtualListOptions
): VirtualListResult {
  const { itemHeight, containerHeight, overscan = 5 } = options;
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    if (scrollElementRef.current) {
      setScrollTop(scrollElementRef.current.scrollTop);
    }
  }, []);

  useEffect(() => {
    const element = scrollElementRef.current;
    if (element) {
      element.addEventListener("scroll", handleScroll);
      return () => element.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight),
    items.length
  );

  const startIndex = Math.max(0, visibleStart - overscan);
  const endIndex = Math.min(items.length, visibleEnd + overscan);

  const virtualItems = [];
  for (let i = startIndex; i < endIndex; i++) {
    virtualItems.push({
      index: i,
      style: {
        position: "absolute" as const,
        top: i * itemHeight,
        left: 0,
        right: 0,
        height: itemHeight,
      },
    });
  }

  return {
    scrollElementRef,
    items: virtualItems,
    totalHeight: items.length * itemHeight,
  };
}
