import logger from "redux-logger";
import { configureStore as configureStoreApp, Middleware } from "@reduxjs/toolkit";
import createRootReducer from "../reducers";

interface PreloadedState {
  [key: string]: any;
}

function configureStore(preloadedState?: PreloadedState) {
  const enhancers: Middleware[] = [];

  const node_env = window._env_?.NODE_ENV ?? process.env?.NODE_ENV;
  if (node_env === "development") {
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
