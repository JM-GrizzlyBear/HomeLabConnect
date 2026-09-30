import "@testing-library/jest-dom/vitest";
import { cleanup, configure } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// findBy* waits 1s by default; the first render in a file (auth check, route load)
// can take longer when turbo runs the API and client suites side by side.
configure({ asyncUtilTimeout: 5_000 });

// jsdom lacks a few browser APIs that Radix (Select, Popover, DropdownMenu) relies on.
Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.releasePointerCapture ??= () => {};
Element.prototype.setPointerCapture ??= () => {};
Element.prototype.scrollIntoView ??= () => {};
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
