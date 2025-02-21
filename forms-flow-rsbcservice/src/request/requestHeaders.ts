/**
 * Utility class for creating request headers.
 */

export const createRequestHeader = async (
  customHeaders: Record<string, string> = {}
): Promise<Record<string, string>> => {
  const baseHeader: Record<string, string> = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    credentials: "same-origin",
    ...customHeaders,
  };
  return baseHeader;
};
