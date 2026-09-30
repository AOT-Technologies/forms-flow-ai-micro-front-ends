// jsdom does not implement TextEncoder/TextDecoder; react-router v7 needs them
// at import time, so expose Node's implementations as globals.
import { TextEncoder, TextDecoder } from "node:util";

Object.assign(global, { TextEncoder, TextDecoder });

// jsdom does not implement window.matchMedia; react-bootstrap's Offcanvas
// (via @restart/hooks useMediaQuery) requires it, so provide a static shim.
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});
