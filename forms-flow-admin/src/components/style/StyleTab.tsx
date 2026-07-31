import React, { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { StyleEditor, DEFAULT_STYLE, StyleConfig } from "@formsflow/components";
import StylePreview from "./StylePreview";
import {
  fetchStyleTemplates,
  createStyleTemplate,
  updateStyleTemplate,
  deleteStyleTemplate,
  setStyleTemplateAsDefault,
  StyleTemplate,
} from "../../services/style";

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
  isDefault: boolean;
}

const EMPTY_FORM: EditForm = {
  id: null,
  name: "",
  styleData: { ...DEFAULT_STYLE },
  isDefault: false,
};

// ── Templates list panel ──────────────────────────────────────────────────────
interface TemplatesListProps {
  templates: StyleTemplate[];
  isLoading: boolean;
  selectedId: number | null;
  onSelect: (tpl: StyleTemplate) => void;
  onAddNew: () => void;
  onEdit: (tpl: StyleTemplate) => void;
  onDelete: (tpl: StyleTemplate) => void;
  onSetDefault: (tpl: StyleTemplate) => void;
}

const TemplatesList: React.FC<TemplatesListProps> = ({
  templates, isLoading, selectedId,
  onSelect, onAddNew, onEdit, onDelete, onSetDefault,
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
          {t("+ Add New")}
        </button>
      </div>

      <div className="ff-style-templates__list">
        {isLoading && (
          <p className="ff-style-templates__status">{t("Loading…")}</p>
        )}
        {!isLoading && templates.length === 0 && (
          <p className="ff-style-templates__status">
            {t("No templates yet. Click '+ Add New' to create one.")}
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
            <div className="ff-style-templates__row-left">
              <span className="ff-style-templates__name">{tpl.name}</span>
              {tpl.isDefault && (
                <span className="ff-style-templates__badge">{t("Default")}</span>
              )}
            </div>
            <div className="ff-style-templates__row-actions">
              {!tpl.isDefault && (
                <button
                  type="button"
                  className="ff-style-templates__action-btn"
                  onClick={(e) => { e.stopPropagation(); onSetDefault(tpl); }}
                  title={t("Set as default")}
                >
                  {t("Set default")}
                </button>
              )}
              <button
                type="button"
                className="ff-style-templates__edit-btn ff-style-templates__edit-btn--active"
                onClick={(e) => { e.stopPropagation(); onEdit(tpl); }}
                aria-label={t("Edit template")}
              >
                {t("Edit")}
              </button>
              <button
                type="button"
                className="ff-style-templates__delete-btn"
                onClick={(e) => { e.stopPropagation(); onDelete(tpl); }}
                aria-label={t("Delete template")}
                title={t("Delete")}
              >
                ✕
              </button>
              <ChevronRight />
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
  onDefaultChange: (checked: boolean) => void;
  onStyleChange: (s: StyleConfig) => void;
  onBack: () => void;
  onSave: () => void;
  onReset: () => void;
  isDirty: boolean;
  isSaving: boolean;
}

const StyleEditorPanel: React.FC<EditorPanelProps> = ({
  editForm, onNameChange, onDefaultChange, onStyleChange,
  onBack, onSave, onReset, isDirty, isSaving,
}) => {
  const { t } = useTranslation();

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
              {t("Template Name")} <span aria-hidden="true">*</span>
            </label>
            <input
              id="stm-name"
              type="text"
              className="ff-style-editor-panel__input"
              value={editForm.name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder={t("e.g. Corporate Blue")}
              maxLength={100}
            />
          </div>
          <div className="ff-style-editor-panel__default-row">
            <input
              id="stm-default"
              type="checkbox"
              checked={editForm.isDefault}
              onChange={(e) => onDefaultChange(e.target.checked)}
            />
            <label htmlFor="stm-default">{t("Set as tenant default")}</label>
          </div>
        </div>
        <StyleEditor styleConfig={editForm.styleData} onChange={onStyleChange} />
      </div>

      <div className="ff-style-editor-panel__footer">
        <button
          type="button"
          className="ff-style-tab__btn ff-style-tab__btn--secondary"
          onClick={onReset}
          disabled={isSaving}
        >
          {t("Reset")}
        </button>
        <div className="ff-style-editor-panel__footer-actions">
          <button
            type="button"
            className="ff-style-tab__btn ff-style-tab__btn--secondary"
            onClick={onBack}
            disabled={isSaving}
          >
            {t("Cancel")}
          </button>
          <button
            type="button"
            className="ff-style-tab__btn ff-style-tab__btn--primary"
            onClick={onSave}
            disabled={isSaving || !isDirty}
          >
            {isSaving ? t("Saving...") : t("Save")}
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
  const [isLoading, setIsLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const previewStyle: StyleConfig =
    editForm?.styleData ||
    templates.find((t) => t.id === selectedId)?.styleData ||
    { ...DEFAULT_STYLE };

  useEffect(() => {
    setIsLoading(true);
    fetchStyleTemplates()
      .then((list) => {
        setTemplates(list);
        if (list.length) setSelectedId(list[0].id);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const openAddNew = () => {
    setEditForm({ ...EMPTY_FORM, styleData: { ...DEFAULT_STYLE } });
    setIsDirty(false);
  };

  const openEdit = (tpl: StyleTemplate) => {
    setEditForm({ id: tpl.id, name: tpl.name, styleData: { ...tpl.styleData }, isDefault: tpl.isDefault });
    setSelectedId(tpl.id);
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

  const handleDefaultChange = (checked: boolean) => {
    setEditForm((prev) => prev ? { ...prev, isDefault: checked } : prev);
    setIsDirty(true);
  };

  const handleReset = () => {
    setEditForm((prev) => prev ? { ...prev, styleData: { ...DEFAULT_STYLE } } : prev);
    setIsDirty(true);
  };

  const handleSave = async () => {
    if (!editForm) return;
    if (!editForm.name.trim()) {
      alert(t("Template name is required."));
      return;
    }
    setIsSaving(true);
    try {
      if (editForm.id) {
        const updated = await updateStyleTemplate(
          editForm.id, editForm.name.trim(), editForm.styleData, editForm.isDefault
        );
        setTemplates((prev) => prev.map((t) => {
          if (t.id === editForm.id) return updated;
          return editForm.isDefault ? { ...t, isDefault: false } : t;
        }));
      } else {
        const created = await createStyleTemplate(
          editForm.name.trim(), editForm.styleData, editForm.isDefault
        );
        setTemplates((prev) => {
          const base = editForm.isDefault ? prev.map((t) => ({ ...t, isDefault: false })) : prev;
          return [...base, created];
        });
        setSelectedId(created.id);
      }
      closeEdit();
    } catch {
      alert(t("Failed to save template. Please try again."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (tpl: StyleTemplate) => {
    if (!window.confirm(t("Delete template '{{name}}'?", { name: tpl.name }))) return;
    setIsSaving(true);
    try {
      await deleteStyleTemplate(tpl.id);
      setTemplates((prev) => prev.filter((t) => t.id !== tpl.id));
      if (selectedId === tpl.id) {
        const remaining = templates.filter((t) => t.id !== tpl.id);
        setSelectedId(remaining[0]?.id ?? null);
      }
      if (editForm?.id === tpl.id) closeEdit();
    } catch {
      alert(t("Failed to delete template."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetDefault = async (tpl: StyleTemplate) => {
    setIsSaving(true);
    try {
      const updated = await setStyleTemplateAsDefault(tpl.id);
      setTemplates((prev) => prev.map((t) => {
        if (t.id === tpl.id) return updated;
        return { ...t, isDefault: false };
      }));
    } catch {
      alert(t("Failed to set default template."));
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
            onDefaultChange={handleDefaultChange}
            onStyleChange={handleStyleChange}
            onBack={closeEdit}
            onSave={handleSave}
            onReset={handleReset}
            isDirty={isDirty}
            isSaving={isSaving}
          />
        ) : (
          <TemplatesList
            templates={templates}
            isLoading={isLoading}
            selectedId={selectedId}
            onSelect={(tpl) => setSelectedId(tpl.id)}
            onAddNew={openAddNew}
            onEdit={openEdit}
            onDelete={handleDelete}
            onSetDefault={handleSetDefault}
          />
        )}
      </div>
      <div className="ff-style-tab__right">
        <StylePreview styleConfig={previewStyle} />
      </div>
    </div>
  );
};

export default StyleTab;
