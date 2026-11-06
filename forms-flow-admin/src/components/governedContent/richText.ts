import React from "react";

// Governed content bodies are stored as HTML and embedded on forms, so every
// read and write goes through this allowlist: the editor's toolbar can only
// produce these tags, and anything else (pasted markup, scripts, handlers,
// javascript: links) is unwrapped or dropped.
type AllowedTag = "p" | "br" | "strong" | "em" | "a" | "ul" | "ol" | "li";

type RichNode =
  | { kind: "text"; text: string }
  | { kind: "element"; tag: AllowedTag; href?: string; children: RichNode[] };

const TAG_MAP: Record<string, AllowedTag> = {
  P: "p",
  DIV: "p",
  BR: "br",
  STRONG: "strong",
  B: "strong",
  EM: "em",
  I: "em",
  A: "a",
  UL: "ul",
  OL: "ol",
  LI: "li",
};

// Removed with their content; any other unknown element is unwrapped.
const DROPPED_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "IFRAME",
  "OBJECT",
  "EMBED",
  "TEMPLATE",
  "NOSCRIPT",
  "SVG",
  "MATH",
  "HEAD",
  "TITLE",
  "META",
  "LINK",
]);

const SAFE_PROTOCOLS = new Set(["https:", "http:", "mailto:"]);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WEB_ADDRESS_PATTERN = /^https?:\/\//i;
const MAILTO_PREFIX = /^mailto:/i;

// Links on a form open in a new tab so submitters keep their progress.
const LINK_TARGET = "_blank";
const LINK_REL = "noopener noreferrer";

const safeHref = (raw: string | null): string | null => {
  const href = raw?.trim();
  if (!href) return null;
  try {
    return SAFE_PROTOCOLS.has(new URL(href).protocol) ? href : null;
  } catch {
    return null;
  }
};

const toRichNodes = (parent: Node): RichNode[] => {
  const nodes: RichNode[] = [];
  parent.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      nodes.push({ kind: "text", text: node.textContent ?? "" });
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const element = node as Element;
    if (DROPPED_TAGS.has(element.tagName)) return;
    const tag = TAG_MAP[element.tagName];
    const href = tag === "a" ? safeHref(element.getAttribute("href")) : null;
    if (!tag || (tag === "a" && !href)) {
      nodes.push(...toRichNodes(element));
      return;
    }
    nodes.push({
      kind: "element",
      tag,
      ...(href ? { href } : {}),
      children: tag === "br" ? [] : toRichNodes(element),
    });
  });
  return nodes;
};

const parseRichText = (html: string): RichNode[] => {
  if (!html) return [];
  const doc = new DOMParser().parseFromString(html, "text/html");
  return toRichNodes(doc.body);
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const serialize = (nodes: RichNode[]): string =>
  nodes
    .map((node) => {
      if (node.kind === "text") return escapeHtml(node.text);
      if (node.tag === "br") return "<br>";
      const attributes = node.href
        ? ` href="${escapeHtml(
            node.href
          )}" target="${LINK_TARGET}" rel="${LINK_REL}"`
        : "";
      return `<${node.tag}${attributes}>${serialize(node.children)}</${
        node.tag
      }>`;
    })
    .join("");

const hasText = (nodes: RichNode[]): boolean =>
  nodes.some((node) =>
    node.kind === "text" ? node.text.trim() !== "" : hasText(node.children)
  );

const toReact = (nodes: RichNode[]): React.ReactNode[] =>
  nodes.map((node, index) => {
    if (node.kind === "text") return node.text;
    const props = node.href
      ? { key: index, href: node.href, target: LINK_TARGET, rel: LINK_REL }
      : { key: index };
    return React.createElement(
      node.tag,
      props,
      ...(node.tag === "br" ? [] : toReact(node.children))
    );
  });

/** Returns the HTML reduced to the allowlist, or "" when it has no visible text. */
export const sanitizeRichText = (html: string): string => {
  const nodes = parseRichText(html);
  return hasText(nodes) ? serialize(nodes) : "";
};

export const escapeText = escapeHtml;

/** Renders stored rich text as React elements (no innerHTML sink). */
export const renderRichText = (html: string): React.ReactNode[] =>
  toReact(parseRichText(html));

/**
 * Turns what the user typed in the link popover into an href: web addresses
 * must start with http(s)://, and a bare email address becomes a mailto: link.
 * Returns null when it is neither.
 */
export const toLinkHref = (input: string): string | null => {
  const value = input.trim();
  if (MAILTO_PREFIX.test(value)) {
    return EMAIL_PATTERN.test(value.replace(MAILTO_PREFIX, "")) ? value : null;
  }
  if (!WEB_ADDRESS_PATTERN.test(value)) {
    return EMAIL_PATTERN.test(value) ? `mailto:${value}` : null;
  }
  try {
    return new URL(value).hostname ? value : null;
  } catch {
    return null;
  }
};

/** The address as it should be shown back in the popover. */
export const toLinkAddress = (href: string | null): string =>
  (href ?? "").replace(MAILTO_PREFIX, "");
