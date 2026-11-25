import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { V8CustomButton } from "@formsflow/components";
import { sanitizeRichText, toLinkAddress, toLinkHref } from "./richText";

// Figma REV 1.4 (B1) toolbar, REV 1.9 link and list states.

interface RichTextEditorProps {
  id: string;
  // Sanitized HTML. Changes made from outside (e.g. a loaded block) replace
  // the editor content; changes echoed back from onChange do not.
  value: string;
  onChange: (html: string) => void;
  labelId: string;
  describedById?: string;
  dataTestId?: string;
}

interface ToolState {
  bold: boolean;
  italic: boolean;
  link: boolean;
  unorderedList: boolean;
  orderedList: boolean;
}

interface LinkDraft {
  // The link being edited, or null when adding one.
  anchor: HTMLAnchorElement | null;
  address: string;
  invalid: boolean;
}

const NO_ACTIVE_TOOLS: ToolState = {
  bold: false,
  italic: false,
  link: false,
  unorderedList: false,
  orderedList: false,
};

// document.execCommand is deprecated but remains the only native way to
// drive contentEditable formatting without an editor library; it is absent
// in some environments (jsdom), hence the guards.
const exec = (command: string, value?: string) => {
  if (typeof document.execCommand === "function") {
    document.execCommand(command, false, value);
  }
};

const isActive = (command: string) =>
  typeof document.queryCommandState === "function" &&
  document.queryCommandState(command);

const closestAnchor = (node: Node | null, root: HTMLElement) => {
  const element = node instanceof Element ? node : node?.parentElement;
  const anchor = element?.closest("a");
  return anchor && root.contains(anchor) ? anchor : null;
};

const sameTools = (a: ToolState, b: ToolState) =>
  (Object.keys(a) as (keyof ToolState)[]).every((tool) => a[tool] === b[tool]);

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  id,
  value,
  onChange,
  labelId,
  describedById,
  dataTestId = "rich-text-editor",
}) => {
  const { t } = useTranslation();
  const editorRef = useRef<HTMLDivElement>(null);
  const emittedRef = useRef<string | null>(null);
  const rangeRef = useRef<Range | null>(null);
  const [tools, setTools] = useState<ToolState>(NO_ACTIVE_TOOLS);
  const [caretLink, setCaretLink] = useState<HTMLAnchorElement | null>(null);
  const [hoverLink, setHoverLink] = useState<HTMLAnchorElement | null>(null);
  const [linkDraft, setLinkDraft] = useState<LinkDraft | null>(null);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || value === emittedRef.current) return;
    // value is sanitized by the caller (see sanitizeRichText).
    editor.innerHTML = value;
    emittedRef.current = value;
  }, [value]);

  useEffect(() => {
    exec("defaultParagraphSeparator", "p");
    exec("styleWithCSS", "false");
  }, []);

  const emitChange = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const html = sanitizeRichText(editor.innerHTML);
    emittedRef.current = html;
    onChange(html);
  }, [onChange]);

  const refreshTools = useCallback(() => {
    const editor = editorRef.current;
    const selection = document.getSelection();
    if (
      !editor ||
      !selection?.rangeCount ||
      !editor.contains(selection.anchorNode)
    ) {
      return;
    }
    rangeRef.current = selection.getRangeAt(0).cloneRange();
    const anchor = closestAnchor(selection.anchorNode, editor);
    const next = {
      bold: isActive("bold"),
      italic: isActive("italic"),
      link: Boolean(anchor),
      unorderedList: isActive("insertUnorderedList"),
      orderedList: isActive("insertOrderedList"),
    };
    setTools((prev) => (sameTools(prev, next) ? prev : next));
    setCaretLink(anchor);
  }, []);

  useEffect(() => {
    document.addEventListener("selectionchange", refreshTools);
    return () => document.removeEventListener("selectionchange", refreshTools);
  }, [refreshTools]);

  const restoreSelection = () => {
    const editor = editorRef.current;
    const range = rangeRef.current;
    const selection = document.getSelection();
    editor?.focus();
    if (range && selection && editor?.contains(range.startContainer)) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
  };

  const runCommand = (command: string) => {
    restoreSelection();
    exec(command);
    emitChange();
    refreshTools();
  };

  const openLinkEditor = () => {
    const editor = editorRef.current;
    if (!editor) return;
    const anchor = rangeRef.current
      ? closestAnchor(rangeRef.current.startContainer, editor)
      : null;
    setHoverLink(null);
    setLinkDraft({
      anchor,
      address: toLinkAddress(anchor?.getAttribute("href") ?? null),
      invalid: false,
    });
  };

  const editLink = (anchor: HTMLAnchorElement) => {
    setHoverLink(null);
    setLinkDraft({
      anchor,
      address: toLinkAddress(anchor.getAttribute("href")),
      invalid: false,
    });
  };

  const closeLinkEditor = () => {
    setLinkDraft(null);
    restoreSelection();
  };

  const insertLink = (href: string, text: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    restoreSelection();
    const selection = document.getSelection();
    if (selection && !selection.isCollapsed) {
      exec("createLink", href);
      return;
    }
    // No selected text: insert the address itself as the link text.
    const link = document.createElement("a");
    link.href = href;
    link.textContent = text;
    const range = rangeRef.current;
    if (range && editor.contains(range.startContainer)) {
      range.insertNode(link);
    } else {
      (editor.lastElementChild ?? editor).appendChild(link);
    }
  };

  const applyLink = () => {
    if (!linkDraft) return;
    const href = toLinkHref(linkDraft.address);
    if (!href) {
      setLinkDraft({ ...linkDraft, invalid: true });
      return;
    }
    if (linkDraft.anchor && editorRef.current?.contains(linkDraft.anchor)) {
      linkDraft.anchor.setAttribute("href", href);
    } else {
      insertLink(href, linkDraft.address.trim());
    }
    setLinkDraft(null);
    emitChange();
  };

  const removeLink = (anchor: HTMLAnchorElement) => {
    anchor.replaceWith(...Array.from(anchor.childNodes));
    setHoverLink(null);
    setCaretLink(null);
    emitChange();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      refreshTools();
      openLinkEditor();
    }
  };

  // Pasted markup would bypass the toolbar's formatting rules: keep the text only.
  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    exec("insertText", event.clipboardData.getData("text/plain"));
    emitChange();
  };

  const handleMouseOver = (event: React.MouseEvent<HTMLDivElement>) => {
    const editor = editorRef.current;
    if (!editor || linkDraft) return;
    const anchor = closestAnchor(event.target as Node, editor);
    if (anchor) setHoverLink(anchor);
  };

  const handleLinkKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      applyLink();
    } else if (event.key === "Escape") {
      event.preventDefault();
      closeLinkEditor();
    }
  };

  const activeLink = linkDraft ? null : hoverLink ?? caretLink;

  const renderTool = (
    tool: keyof ToolState,
    label: string,
    onClick: () => void,
    ariaLabel?: string
  ) => (
    <button
      type="button"
      className={`ff-rich-text__tool ff-rich-text__tool--${tool}${
        tools[tool] ? " ff-rich-text__tool--active" : ""
      }`}
      aria-pressed={tools[tool]}
      aria-label={ariaLabel}
      // Keep the editor's selection when the toolbar is clicked.
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      data-testid={`${dataTestId}-${tool}`}
    >
      {label}
    </button>
  );

  return (
    <div
      className="ff-rich-text"
      onMouseLeave={() => setHoverLink(null)}
      data-testid={dataTestId}
    >
      <div
        className="ff-rich-text__toolbar"
        role="toolbar"
        aria-label={t("Formatting")}
        aria-controls={id}
      >
        {renderTool("bold", "B", () => runCommand("bold"), t("Bold"))}
        {renderTool("italic", "I", () => runCommand("italic"), t("Italic"))}
        <span className="ff-rich-text__divider" aria-hidden="true" />
        {renderTool("link", t("Link"), openLinkEditor)}
        <span className="ff-rich-text__divider" aria-hidden="true" />
        {renderTool("unorderedList", t("Bulleted list"), () =>
          runCommand("insertUnorderedList")
        )}
        {renderTool("orderedList", t("Numbered list"), () =>
          runCommand("insertOrderedList")
        )}
      </div>

      <div
        id={id}
        ref={editorRef}
        className="ff-rich-text__area"
        role="textbox"
        aria-multiline="true"
        aria-labelledby={labelId}
        aria-describedby={describedById}
        tabIndex={0}
        contentEditable
        suppressContentEditableWarning
        onInput={emitChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onMouseOver={handleMouseOver}
        // Keyboard users get the link bar from the caret position instead.
        onFocus={refreshTools}
        data-testid={`${dataTestId}-area`}
      />

      {activeLink && (
        <div
          className="ff-rich-text__link-bar"
          data-testid={`${dataTestId}-link-bar`}
        >
          <span className="ff-rich-text__link-address">
            {activeLink.getAttribute("href")}
          </span>
          <button
            type="button"
            className="ff-rich-text__link-action ff-rich-text__link-action--edit"
            onClick={() => editLink(activeLink)}
            data-testid={`${dataTestId}-link-edit`}
          >
            {t("Edit")}
          </button>
          <button
            type="button"
            className="ff-rich-text__link-action"
            onClick={() => removeLink(activeLink)}
            data-testid={`${dataTestId}-link-remove`}
          >
            {t("Remove")}
          </button>
        </div>
      )}

      {linkDraft && (
        <div
          className="ff-rich-text__link-popover"
          role="dialog"
          aria-label={t("Link")}
          data-testid={`${dataTestId}-link-popover`}
        >
          <label
            htmlFor={`${id}-link-address`}
            className="ff-rich-text__link-label"
          >
            {t("Address")}
          </label>
          <input
            id={`${id}-link-address`}
            className={`form-control ff-rich-text__link-input${
              linkDraft.invalid ? " ff-rich-text__link-input--invalid" : ""
            }`}
            value={linkDraft.address}
            onChange={(event) =>
              setLinkDraft({
                ...linkDraft,
                address: event.target.value,
                invalid: false,
              })
            }
            onKeyDown={handleLinkKeyDown}
            aria-invalid={linkDraft.invalid}
            aria-describedby={`${id}-link-hint`}
            autoFocus
            data-testid={`${dataTestId}-link-input`}
          />
          <p
            id={`${id}-link-hint`}
            className={`ff-rich-text__link-hint${
              linkDraft.invalid ? " ff-rich-text__link-hint--invalid" : ""
            }`}
            role={linkDraft.invalid ? "alert" : undefined}
          >
            {linkDraft.invalid
              ? t(
                  "Enter a web address starting with https://, or an email address."
                )
              : t("A web address or an email address.")}
          </p>
          <div className="ff-rich-text__link-buttons">
            <V8CustomButton
              label={t("Cancel")}
              variant="secondary"
              onClick={closeLinkEditor}
              dataTestId={`${dataTestId}-link-cancel`}
            />
            <V8CustomButton
              label={linkDraft.anchor ? t("Update link") : t("Add link")}
              variant="primary"
              onClick={applyLink}
              dataTestId={`${dataTestId}-link-apply`}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;
