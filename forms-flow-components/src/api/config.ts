import React from "react";

declare global {
  interface Window {
    _env_?: Record<string, string | boolean>;
  }
}

export const DOCUMENT_SERVICE_URL =
  window._env_?.REACT_APP_DOCUMENT_SERVICE_URL;

function getEnv(env_string: string): boolean {
  const ENV_VALUE = window._env_?.[env_string];

  if (typeof ENV_VALUE === "boolean") {
    return ENV_VALUE;
  }

  if (typeof ENV_VALUE === "string") {
    return ENV_VALUE.toLowerCase() === "true";
  }

  return false;
}

// Either take values from env or can directly give true or false
export const featureFlags = {
  exportPdf: getEnv("REACT_APP_EXPORT_PDF_ENABLED"),
} as const;

// Higher-order component function to conditionally render components based on feature flags
export const withFeature = <P extends object>(
  featureName: keyof typeof featureFlags
) => {
  return (Component: React.ComponentType<P>) => {
    const WrappedComponent: React.FC<P> = (props) => {
      if (!featureFlags[featureName]) {
        return null;
      }
      return React.createElement(Component, props);
    };

    WrappedComponent.displayName = `withFeature(${featureName})(${
      Component.displayName || Component.name || "Component"
    })`;

    return WrappedComponent;
  };
};
