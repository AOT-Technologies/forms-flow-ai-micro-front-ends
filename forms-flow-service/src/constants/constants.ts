export const DATE_FORMAT =
  (window as any)._env_ && (window as any)._env_.REACT_APP_DATE_FORMAT || "YYYY-MM-DD";

export const TIME_FORMAT =
(window as any)._env_ && (window as any)._env_.REACT_APP_TIME_FORMAT || "HH:mm:ss";

const MULTITENANCY_ENABLED_VARIABLE = (window as any)._env_?.REACT_APP_MULTI_TENANCY_ENABLED || false;

export const MULTITENANCY_ENABLED =
  MULTITENANCY_ENABLED_VARIABLE === "true" ||
    MULTITENANCY_ENABLED_VARIABLE === true

//application details
export const APPLICATION_NAME =
        (window as any).REACT_APP_APPLICATION_NAME || "roadsafety"
        // "formsflow.ai";

// Used in encyrpting and decrypting the token from local storage.
export const TOKEN_ENCRYPTION_KEY =
        (window as any).REACT_APP_TOKEN_ENCRYPTION_KEY ||
        "8f4a4e01b639aa73d2b5bdb6e9f2e6aef471b3dbba3d5e48e3a798fc3d6d6cbb";