// Service modules read `window._env_` at import time; provide a minimal
// window object for the node test environment.
global.window = global.window || {};
