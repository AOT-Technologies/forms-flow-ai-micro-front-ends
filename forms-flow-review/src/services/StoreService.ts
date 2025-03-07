import { createBrowserHistory } from "history";
import { routerMiddleware } from "connected-react-router";
import logger from "redux-logger";
import { configureStore as configureStoreApp, Middleware } from "@reduxjs/toolkit";
import createRootReducer from "../reducers";
const history = createBrowserHistory();

interface PreloadedState {
  [key: string]: any; // Define a proper state type if possible
}

function configureStore(preloadedState?: PreloadedState) {
  const enhancers: Middleware[] = [routerMiddleware(history)];

  const node_env =
    (window._env_ && window._env_.NODE_ENV) || process.env.NODE_ENV;
  if (node_env === "development") {
    enhancers.push(logger);
  }

  return configureStoreApp({
    reducer: createRootReducer(history),
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ serializableCheck: false }).concat(enhancers),
    preloadedState,
  });
}

const StoreService = {
  history,
  configureStore,
};

export default StoreService;
