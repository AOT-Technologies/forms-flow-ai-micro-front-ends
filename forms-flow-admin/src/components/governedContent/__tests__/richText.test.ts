import React from "react";
import { render } from "@testing-library/react";
import {
  renderRichText,
  sanitizeRichText,
  toLinkAddress,
  toLinkHref,
} from "../richText";

describe("sanitizeRichText", () => {
  it("keeps the toolbar's formatting and normalises b/i/div", () => {
    expect(
      sanitizeRichText(
        "<div>We <b>collect</b> <i>this</i>:</div><ul><li>one</li></ul><ol><li>two</li></ol>"
      )
    ).toBe(
      "<p>We <strong>collect</strong> <em>this</em>:</p><ul><li>one</li></ul><ol><li>two</li></ol>"
    );
  });

  it("drops scripts and handlers, and unwraps unknown elements", () => {
    expect(
      sanitizeRichText(
        '<p onclick="x()">Hi <span style="color:red">there</span><script>alert(1)</script><img src=x onerror="alert(2)"></p>'
      )
    ).toBe("<p>Hi there</p>");
  });

  it("keeps safe links, opening in a new tab, and unwraps unsafe ones", () => {
    expect(
      sanitizeRichText(
        '<p><a href="https://example.org/privacy">Privacy Office</a> <a href="javascript:alert(1)">bad</a></p>'
      )
    ).toBe(
      '<p><a href="https://example.org/privacy" target="_blank" rel="noopener noreferrer">Privacy Office</a> bad</p>'
    );
  });

  it("escapes text", () => {
    expect(sanitizeRichText('<p>a &lt;b&gt; &amp; "c"</p>')).toBe(
      "<p>a &lt;b&gt; &amp; &quot;c&quot;</p>"
    );
  });

  it("returns an empty string when there is no visible text", () => {
    expect(sanitizeRichText("<p><br></p><p>   </p>")).toBe("");
    expect(sanitizeRichText("")).toBe("");
  });
});

describe("renderRichText", () => {
  it("renders the allowlist as React elements", () => {
    const { container } = render(
      React.createElement(
        React.Fragment,
        null,
        ...renderRichText(
          '<p>Ask the <a href="mailto:privacy@example.org">Privacy Office</a><br><strong>now</strong></p><script>x</script>'
        )
      )
    );
    expect(container.innerHTML).toBe(
      '<p>Ask the <a href="mailto:privacy@example.org" target="_blank" rel="noopener noreferrer">Privacy Office</a><br><strong>now</strong></p>'
    );
  });
});

describe("toLinkHref", () => {
  it.each([
    ["https://example.org/privacy", "https://example.org/privacy"],
    ["  http://example.org  ", "http://example.org"],
    ["privacy@example.org", "mailto:privacy@example.org"],
    ["mailto:privacy@example.org", "mailto:privacy@example.org"],
    ["https://user@example.org/a", "https://user@example.org/a"],
  ])("accepts %p", (input, expected) => {
    expect(toLinkHref(input)).toBe(expected);
  });

  it.each([
    "privacy office page",
    "example.org",
    "javascript:alert(1)",
    "mailto:nobody",
    "",
  ])("rejects %p", (input) => {
    expect(toLinkHref(input)).toBeNull();
  });

  it("shows mailto links back as the bare address", () => {
    expect(toLinkAddress("mailto:privacy@example.org")).toBe(
      "privacy@example.org"
    );
    expect(toLinkAddress(null)).toBe("");
  });
});
