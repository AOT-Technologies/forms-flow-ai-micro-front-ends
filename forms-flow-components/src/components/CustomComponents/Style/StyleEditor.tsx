import React from "react";
import { useTranslation } from "react-i18next";
import { StyleConfig, DEFAULT_STYLE } from "./themeConstants";
import ColorPicker from "./ColorPicker";
import FontPicker from "./FontPicker";
import ButtonShapeToggle from "./ButtonShapeToggle";

interface StyleEditorProps {
  styleConfig: Partial<StyleConfig>;
  onChange: (updated: StyleConfig) => void;
}

const StyleEditor: React.FC<StyleEditorProps> = ({ styleConfig, onChange }) => {
  const { t } = useTranslation();
  const merged: StyleConfig = { ...DEFAULT_STYLE, ...styleConfig };

  const handleChange = (key: keyof StyleConfig, value: string) => {
    onChange({ ...merged, [key]: value });
  };

  return (
    <div className="ff-style-editor">
      <section className="ff-style-editor__section">
        <h4 className="ff-style-editor__section-title">{t("Colours")}</h4>
        <ColorPicker
          label={t("Background")}
          value={merged.background}
          onChange={(hex) => handleChange("background", hex)}
          palette="neutral"
        />
        <ColorPicker
          label={t("Accent")}
          value={merged.accent}
          onChange={(hex) => handleChange("accent", hex)}
          palette="neutral"
        />
        <ColorPicker
          label={t("Buttons")}
          value={merged.buttons}
          onChange={(hex) => handleChange("buttons", hex)}
          palette="vivid"
        />
      </section>

      <section className="ff-style-editor__section">
        <h4 className="ff-style-editor__section-title">{t("Type")}</h4>
        <FontPicker
          label={t("Headers")}
          value={merged.headerFont}
          onChange={(key) => handleChange("headerFont", key)}
        />
        <FontPicker
          label={t("Body")}
          value={merged.bodyFont}
          onChange={(key) => handleChange("bodyFont", key)}
        />
      </section>

      <section className="ff-style-editor__section">
        <h4 className="ff-style-editor__section-title">{t("Buttons")}</h4>
        <ButtonShapeToggle
          value={merged.buttonShape}
          onChange={(key) => handleChange("buttonShape", key)}
        />
      </section>
    </div>
  );
};

export default StyleEditor;
