import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { StyleEditor, DEFAULT_STYLE, StyleConfig, V8CustomButton, PromptModal } from "@formsflow/components";
import StylePreview from "./StylePreview";
import {
  fetchStyleTemplates,
  createStyleTemplate,
  updateStyleTemplate,
  deleteStyleTemplate,
  setStyleTemplateAsGlobal,
  clearGlobalStyleTemplate,
  fetchTenantStyle,
  saveTenantStyle,
  StyleTemplate,
} from "../../services/style";

// Sentinel id for the virtual "Default" row -- not a named template, but its
// style is editable and updatable just like one, backed by the tenant-level
// `/style` record (fetchTenantStyle/saveTenantStyle) rather than a template id.
const DEFAULT_ROW_ID = -1;

// ── Icons ─────────────────────────────────────────────────────────────────────
const ChevronRight: React.FC = () => (
  <svg width="7" height="12" viewBox="0 0 7 12" fill="none" aria-hidden="true">
    <path d="M1 1l5 5-5 5" stroke="#7C7D7F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const BackArrow: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M10 13L5 8l5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ── Edit form state ───────────────────────────────────────────────────────────
interface EditForm {
  id: number | null;
  name: string;
  styleData: StyleConfig;
}

const EMPTY_FORM: EditForm = {
  id: null,
  name: "",
  styleData: { ...DEFAULT_STYLE },
};

// ── Templates list panel ──────────────────────────────────────────────────────
interface TemplatesListProps {
  templates: StyleTemplate[];
  isLoading: boolean;
  selectedId: number | null;
  isDefaultGlobal: boolean;
  onSelect: (tpl: StyleTemplate) => void;
  onSelectDefault: () => void;
  onAddNew: () => void;
  onEdit: (tpl: StyleTemplate) => void;
  onEditDefault: () => void;
}

const TemplatesList: React.FC<TemplatesListProps> = ({
  templates, isLoading, selectedId, isDefaultGlobal,
  onSelect, onSelectDefault, onAddNew, onEdit, onEditDefault,
}) => {
  const { t } = useTranslation();

  return (
    <div className="ff-style-templates">
      <div className="ff-style-templates__header">
        <span className="ff-style-templates__heading">{t("Templates")}</span>
        <button
          type="button"
          className="ff-style-templates__action-btn"
          onClick={onAddNew}
          aria-label={t("Add New template")}
        >
          {t("Add New")}
        </button>
      </div>

      <div className="ff-style-templates__list">
        {/* Virtual "Default" row — always first, not deletable, but editable
            like any other template. Its style is the tenant-level fallback
            theme used when no template is set global. */}
        <div
          className={`ff-style-templates__row${selectedId === DEFAULT_ROW_ID ? " ff-style-templates__row--selected" : ""}`}
          onClick={onSelectDefault}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && onSelectDefault()}
        >
          <div className="ff-style-templates__row-inner">
            <div className="ff-style-templates__row-left">
              <span className="ff-style-templates__name">{t("Default")}</span>
            </div>
            <div className="ff-style-templates__row-actions">
              <button
                type="button"
                className={`ff-style-templates__edit-btn${isDefaultGlobal ? " ff-style-templates__edit-btn--active" : ""}`}
                onClick={(e) => { e.stopPropagation(); onEditDefault(); }}
                aria-label={t("Edit template")}
              >
                {t("Edit")}
              </button>
              <ChevronRight />
            </div>
          </div>
        </div>

        {isLoading && (
          <p className="ff-style-templates__status">{t("Loading…")}</p>
        )}
        {!isLoading && templates.length === 0 && (
          <p className="ff-style-templates__status">
            {t("No templates yet. Click 'Add New' to create one.")}
          </p>
        )}
        {templates.map((tpl) => (
          <div
            key={tpl.id}
            className={`ff-style-templates__row${tpl.id === selectedId ? " ff-style-templates__row--selected" : ""}`}
            onClick={() => onSelect(tpl)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && onSelect(tpl)}
          >
            <div className="ff-style-templates__row-inner">
              <div className="ff-style-templates__row-left">
                <span className="ff-style-templates__name">{tpl.name}</span>
              </div>
              <div className="ff-style-templates__row-actions">
                <button
                  type="button"
                  className={`ff-style-templates__edit-btn${tpl.isGlobal ? " ff-style-templates__edit-btn--active" : ""}`}
                  onClick={(e) => { e.stopPropagation(); onEdit(tpl); }}
                  aria-label={t("Edit template")}
                >
                  {t("Edit")}
                </button>
                <ChevronRight />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Style editor panel ────────────────────────────────────────────────────────
interface EditorPanelProps {
  editForm: EditForm;
  onNameChange: (name: string) => void;
  onStyleChange: (s: StyleConfig) => void;
  onBack: () => void;
  onSave: () => void;
  onDelete: () => void;
  isDirty: boolean;
  isSaving: boolean;
}

const StyleEditorPanel: React.FC<EditorPanelProps> = ({
  editForm, onNameChange, onStyleChange,
  onBack, onSave, onDelete, isDirty, isSaving,
}) => {
  const { t } = useTranslation();
  const saveOrUpdateLabel = editForm.id ? t("Update") : t("Save");

  return (
    <div className="ff-style-editor-panel">
      <div className="ff-style-editor-panel__header">
        <button
          type="button"
          className="ff-style-editor-panel__back"
          onClick={onBack}
          aria-label={t("Back to templates")}
        >
          <BackArrow />
          <span>{t("Templates")}</span>
        </button>
        <span className="ff-style-editor-panel__title">
          {editForm.id ? t("Edit Template") : t("New Template")}
        </span>
      </div>

      <div className="ff-style-editor-panel__body">
        <div className="ff-style-editor-panel__fields">
          <div className="ff-style-editor-panel__field">
            <label className="ff-style-editor-panel__label" htmlFor="stm-name">
              {t("Name")}
            </label>
            <input
              id="stm-name"
              type="text"
              className="ff-style-editor-panel__input"
              value={editForm.name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder={t("e.g. Corporate Blue")}
              maxLength={100}
              disabled={editForm.id === DEFAULT_ROW_ID}
            />
          </div>
        </div>
        <StyleEditor styleConfig={editForm.styleData} onChange={onStyleChange} />
      </div>

      <div className="ff-style-editor-panel__footer">
        <div className="ff-style-editor-panel__footer-left-actions">
          {editForm.id && editForm.id !== DEFAULT_ROW_ID && (
            <V8CustomButton
              id="delete-style-template-btn"
              variant="error"
              onClick={onDelete}
              disabled={isSaving}
              label={t("Delete")}
              ariaLabel={t("Delete template")}
              dataTestId="delete-style-template-btn"
            />
          )}
        </div>
        <div className="ff-style-editor-panel__footer-actions">
          <button
            type="button"
            className="ff-style-tab__btn ff-style-tab__btn--primary"
            onClick={onSave}
            disabled={isSaving || !isDirty}
          >
            {isSaving ? t("Saving...") : saveOrUpdateLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main StyleTab ─────────────────────────────────────────────────────────────
const StyleTab: React.FC = () => {
  const { t } = useTranslation();
  const [templates, setTemplates] = useState<StyleTemplate[]>([]);
  const [defaultStyle, setDefaultStyle] = useState<StyleConfig>({ ...DEFAULT_STYLE });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

  const globalTemplate = templates.find((tpl) => tpl.isGlobal) || null;
  const isDefaultGlobal = !globalTemplate;

  const previewStyle: StyleConfig =
    editForm?.styleData ||
    (selectedId === DEFAULT_ROW_ID ? defaultStyle : undefined) ||
    templates.find((tpl) => tpl.id === selectedId)?.styleData ||
    defaultStyle;

  useEffect(() => {
    setIsLoading(true);
    Promise.all([fetchStyleTemplates(), fetchTenantStyle()])
      .then(([list, tenantStyle]) => {
        setTemplates(list);
        if (tenantStyle) setDefaultStyle({ ...DEFAULT_STYLE, ...tenantStyle });
        const global = list.find((tpl) => tpl.isGlobal);
        setSelectedId(global ? global.id : DEFAULT_ROW_ID);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const openAddNew = () => {
    setEditForm({ ...EMPTY_FORM, styleData: { ...DEFAULT_STYLE } });
    setIsDirty(false);
  };

  const openEdit = (tpl: StyleTemplate) => {
    setEditForm({ id: tpl.id, name: tpl.name, styleData: { ...tpl.styleData } });
    setSelectedId(tpl.id);
    setIsDirty(false);
  };

  // Default is a virtual row (no template id) whose style lives on the
  // tenant-level `/style` record -- editable and updatable just like any
  // other template, but never deletable and its name is fixed.
  const openEditDefault = () => {
    setEditForm({ id: DEFAULT_ROW_ID, name: t("Default"), styleData: { ...defaultStyle } });
    setSelectedId(DEFAULT_ROW_ID);
    setIsDirty(false);
  };

  const closeEdit = () => {
    setEditForm(null);
    setIsDirty(false);
  };

  const handleStyleChange = useCallback((updated: StyleConfig) => {
    setEditForm((prev) => prev ? { ...prev, styleData: updated } : prev);
    setIsDirty(true);
  }, []);

  const handleNameChange = (name: string) => {
    setEditForm((prev) => prev ? { ...prev, name } : prev);
    setIsDirty(true);
  };

  // Surfaces the backend's specific message (e.g. the branding-logo
  // owner-only rejection) when present, falling back to a generic one.
  const errorMessage = (err: any, fallback: string): string =>
    err?.response?.data?.message || fallback;

  const handleSave = async () => {
    if (!editForm) return;
    if (editForm.id === DEFAULT_ROW_ID) {
      setIsSaving(true);
      try {
        await saveTenantStyle(editForm.styleData);
        setDefaultStyle(editForm.styleData);
        closeEdit();
      } catch (err) {
        alert(errorMessage(err, t("Failed to save default theme. Please try again.")));
      } finally {
        setIsSaving(false);
      }
      return;
    }
    if (!editForm.name.trim()) {
      alert(t("Template name is required."));
      return;
    }
    setIsSaving(true);
    try {
      if (editForm.id) {
        const updated = await updateStyleTemplate(editForm.id, editForm.name.trim(), editForm.styleData);
        setTemplates((prev) => prev.map((tpl) => (tpl.id === editForm.id ? updated : tpl)));
      } else {
        const created = await createStyleTemplate(editForm.name.trim(), editForm.styleData);
        setTemplates((prev) => [...prev, created]);
        setSelectedId(created.id);
      }
      closeEdit();
    } catch (err) {
      alert(errorMessage(err, t("Failed to save template. Please try again.")));
    } finally {
      setIsSaving(false);
    }
  };

  // Delete lives inside the edit panel now (bottom-left, next to Save) rather
  // than as a row-level action — editing a template is the entry point to
  // removing it too.
  const performDelete = async () => {
    if (!editForm?.id || editForm.id === DEFAULT_ROW_ID) return;
    setIsSaving(true);
    try {
      await deleteStyleTemplate(editForm.id);
      setTemplates((prev) => prev.filter((tpl) => tpl.id !== editForm.id));
      if (selectedId === editForm.id) setSelectedId(DEFAULT_ROW_ID);
      closeEdit();
    } catch {
      alert(t("Failed to delete template."));
    } finally {
      setIsSaving(false);
    }
  };

  // Clicking Delete while there are unsaved edits warns instead of silently
  // discarding them (see the "You Have Unsaved Changes" modal below) --
  // with nothing unsaved, delete right away with no confirmation prompt.
  const handleDeleteFromEdit = () => {
    if (!editForm?.id || editForm.id === DEFAULT_ROW_ID) return;
    if (isDirty) {
      setShowUnsavedModal(true);
      return;
    }
    performDelete();
  };

  const handleDiscardAndDelete = () => {
    setShowUnsavedModal(false);
    performDelete();
  };

  const handleUpdateInsteadOfDelete = async () => {
    setShowUnsavedModal(false);
    await handleSave();
  };

  // Clicking a template row both previews it and immediately makes it the
  // tenant's global (currently-applied) theme -- there's no separate switch.
  const handleSelectTemplate = async (tpl: StyleTemplate) => {
    setSelectedId(tpl.id);
    if (tpl.isGlobal) return;
    setIsSaving(true);
    try {
      const updated = await setStyleTemplateAsGlobal(tpl.id);
      setTemplates((prev) => prev.map((t) => {
        if (t.id === tpl.id) return updated;
        return { ...t, isGlobal: false };
      }));
    } catch {
      alert(t("Failed to set global template."));
    } finally {
      setIsSaving(false);
    }
  };

  // Clicking the virtual "Default" row clears the global theme entirely —
  // forms with no override/assignment of their own fall back to the
  // tenant-level default theme (editable via openEditDefault/handleSave).
  const handleSelectDefault = async () => {
    setSelectedId(DEFAULT_ROW_ID);
    if (!globalTemplate) return;
    setIsSaving(true);
    try {
      await clearGlobalStyleTemplate();
      setTemplates((prev) => prev.map((t) => ({ ...t, isGlobal: false })));
    } catch {
      alert(t("Failed to reset to default theme."));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="ff-style-tab">
      <div className="ff-style-tab__left">
        {editForm ? (
          <StyleEditorPanel
            editForm={editForm}
            onNameChange={handleNameChange}
            onStyleChange={handleStyleChange}
            onBack={closeEdit}
            onSave={handleSave}
            onDelete={handleDeleteFromEdit}
            isDirty={isDirty}
            isSaving={isSaving}
          />
        ) : (
          <TemplatesList
            templates={templates}
            isLoading={isLoading}
            selectedId={selectedId}
            isDefaultGlobal={isDefaultGlobal}
            onSelect={handleSelectTemplate}
            onSelectDefault={handleSelectDefault}
            onAddNew={openAddNew}
            onEdit={openEdit}
            onEditDefault={openEditDefault}
          />
        )}
      </div>
      <div className="ff-style-tab__right">
        <StylePreview styleConfig={previewStyle} />
      </div>

      {/* Same PromptModal used to guard leaving the form/flow editor with
          unsaved changes (see NavigateBlocker.jsx) -- no header close icon
          and no footer divider are both native to this component, not CSS
          overrides. dialogClassName is forwarded to AppModal via restProps. */}
      <PromptModal
        show={showUnsavedModal}
        onClose={() => setShowUnsavedModal(false)}
        dialogClassName="ff-unsaved-changes-modal"
        title={t("You Have Unsaved Changes")}
        message={
          <>
            <p>{t("Your changes haven't been applied yet.")}</p>
            <p>{t("If you leave now, your forms will keep using the current style.")}</p>
          </>
        }
        primaryBtnText={t("Update")}
        primaryBtnAction={handleUpdateInsteadOfDelete}
        secondaryBtnText={t("Discard changes")}
        secondaryBtnAction={handleDiscardAndDelete}
        buttonLoading={isSaving}
        secondaryBtnLoading={isSaving}
      />
    </div>
  );
};

export default StyleTab;
