import {
  configureStore as configureStoreApp,
  Middleware,
} from "@reduxjs/toolkit";
import createRootReducer from "../reducers";

interface PreloadedState {
  [key: string]: any;
}

function configureStore(preloadedState?: PreloadedState) {
  const enhancers: Middleware[] = [];

  const node_env = window._env_?.NODE_ENV ?? process.env?.NODE_ENV;
  if (node_env === "development") {
    // redux-logger is only needed in development; require it here (instead of a
    // top-level import) so production startup never evaluates the module. Kept
    // synchronous so the logger is active from the very first dispatch, with
    // middleware order unchanged.
    const logger: Middleware = require("redux-logger").default;
    enhancers.push(logger);
  }

  return configureStoreApp({
    reducer: createRootReducer(),
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ serializableCheck: false }).concat(enhancers),
    preloadedState,
  });
}

const StoreService = {
  configureStore,
};

export default StoreService;
