import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import {
  ApplicationLogoFull,
  PromptModal,
  V8CustomButton,
} from "@formsflow/components";
import {
  BRANDING_UPDATED_EVENT,
  applyBranding,
  cacheBranding,
} from "@formsflow/service";
import LogoAlert from "./LogoAlert";
import LogoUpload, { SelectedLogo } from "./LogoUpload";
import LivePreview from "./LivePreview";
import {
  BrandingDraft,
  BrandingResponse,
  ButtonShape,
  fetchBranding,
  resetBranding,
  saveBranding,
} from "../../services/appearance";
import "./appearance.scss";

const DISPLAY_NAME_MAX = 20;

const EMPTY_DRAFT: BrandingDraft = {
  displayName: "",
  buttonShape: "rounded",
};

const toDraft = (branding: BrandingResponse | null): BrandingDraft => ({
  displayName: branding?.displayName ?? "",
  buttonShape: branding?.buttonShape === "square" ? "square" : "rounded",
});

interface AppearanceTabProps {
  // Tenant key for the branding cache (null in single-tenant installs).
  tenantKey: string | null;
  publish?: (event: string, data: unknown) => void;
  // App home route, rendered in the live-preview iframe.
  homeUrl: string;
}

const AppearanceTab: React.FC<AppearanceTabProps> = ({
  tenantKey,
  publish,
  homeUrl,
}) => {
  const { t } = useTranslation();
  const [saved, setSaved] = useState<BrandingResponse | null>(null);
  const [draft, setDraft] = useState<BrandingDraft>(EMPTY_DRAFT);
  const [selectedLogo, setSelectedLogo] = useState<SelectedLogo | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [error, setError] = useState<{ message: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmRestore, setConfirmRestore] = useState(false);

  useEffect(() => {
    fetchBranding()
      .then((data) => {
        setSaved(data);
        setDraft(toDraft(data));
      })
      .catch(() =>
        setError({ message: t("Appearance settings could not be loaded") })
      );
  }, [t]);

  const savedLogo = removeLogo ? null : saved?.logoUrl ?? null;
  const currentLogo = selectedLogo?.dataUrl ?? savedLogo;
  // The card shows the newly chosen file, else the saved logo; deleting the
  // saved one takes effect on Update.
  const logoCard =
    selectedLogo ??
    (savedLogo ? { name: saved?.logoName ?? "", dataUrl: savedLogo } : null);
  const previewBranding = useMemo(
    () => ({
      displayName: draft.displayName.trim() || null,
      buttonShape: draft.buttonShape,
      logoUrl: currentLogo,
    }),
    [draft.displayName, draft.buttonShape, currentLogo]
  );
  const dismissError = useCallback(() => setError(null), []);

  // Nothing customised: every field falls back to the default.
  const isCustomised = Boolean(
    saved?.displayName || saved?.buttonShape || saved?.logoUrl
  );
  const isDirty =
    JSON.stringify(draft) !== JSON.stringify(toDraft(saved)) ||
    Boolean(selectedLogo) ||
    removeLogo;

  useEffect(() => {
    if (!isDirty) return undefined;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  const update = (patch: Partial<BrandingDraft>) =>
    setDraft((prev) => ({ ...prev, ...patch }));

  // Applied in place (no reload): this page and the nav update now, other
  // users pick it up on their next page load.
  const finish = (branding: BrandingResponse) => {
    cacheBranding(branding, tenantKey);
    applyBranding(branding);
    publish?.(BRANDING_UPDATED_EVENT, branding);
    setSaved(branding);
    setDraft(toDraft(branding));
    setSelectedLogo(null);
    setRemoveLogo(false);
    toast.success(t("Appearance updated successfully"));
  };

  const handleUpdate = () => {
    setBusy(true);
    saveBranding(draft, selectedLogo?.file ?? null, removeLogo)
      .then(finish)
      .catch((err: any) => {
        const detail = err?.response?.data?.details?.[0]?.message;
        setError({
          message:
            detail ||
            t(
              "Appearance could not be saved. Your previous settings are unchanged."
            ),
        });
      })
      .finally(() => setBusy(false));
  };

  const handleRestore = () => {
    setBusy(true);
    resetBranding()
      .then(finish)
      .catch(() =>
        setError({
          message: t("Appearance could not be restored. Please try again."),
        })
      )
      .finally(() => {
        setBusy(false);
        setConfirmRestore(false);
      });
  };

  return (
    <div className="ff-appearance">
      <div className="ff-appearance__editor">
        <section className="ff-appearance__section">
          <div className="ff-appearance__section-header">
            <label htmlFor="appearance-display-name">{t("Display name")}</label>
          </div>
          <input
            id="appearance-display-name"
            className="form-control"
            value={draft.displayName}
            maxLength={DISPLAY_NAME_MAX}
            placeholder={t("Default Name")}
            onChange={(e) => update({ displayName: e.target.value })}
            data-testid="appearance-display-name"
          />
        </section>

        <section className="ff-appearance__section">
          <div className="ff-appearance__section-header">{t("Buttons")}</div>
          <div
            className="ff-appearance__shapes"
            role="radiogroup"
            aria-label={t("Buttons")}
          >
            {(["rounded", "square"] as ButtonShape[]).map((shape) => (
              <button
                key={shape}
                type="button"
                role="radio"
                aria-checked={draft.buttonShape === shape}
                className={`ff-appearance__shape ff-appearance__shape--${shape}${
                  draft.buttonShape === shape
                    ? " ff-appearance__shape--selected"
                    : ""
                }`}
                onClick={() => update({ buttonShape: shape })}
              >
                {t(shape === "rounded" ? "Rounded" : "Square")}
              </button>
            ))}
          </div>
        </section>

        <section className="ff-appearance__section">
          <div className="ff-appearance__section-header">{t("Logo")}</div>
          {/* Figma 30551:2656: always the formsflow.ai logo; the custom one is in the card below. */}
          <div className="ff-appearance__logo-current">
            <ApplicationLogoFull width={112} height={21} />
          </div>
          <LogoUpload
            storageConfigured={saved?.logoUploadEnabled !== false}
            selected={logoCard}
            onSelect={(logo) => {
              setSelectedLogo(logo);
              setRemoveLogo(false);
              setError(null);
            }}
            onClear={() =>
              selectedLogo ? setSelectedLogo(null) : setRemoveLogo(true)
            }
            onError={(message) => setError({ message })}
          />
          <p className="ff-appearance__hint">
            {t(
              "Images should be JPEG, PNG or GIF and should be 20 x 20 pixels in size. Max file size 3MB."
            )}
          </p>
        </section>

        <div className="ff-appearance__footer">
          <V8CustomButton
            label="Restore to Default"
            variant="secondary"
            disabled={busy || !isCustomised}
            onClick={() => setConfirmRestore(true)}
            dataTestId="appearance-restore"
          />
          <V8CustomButton
            label="Update"
            variant="primary"
            disabled={busy || !isDirty}
            onClick={handleUpdate}
            dataTestId="appearance-update"
          />
        </div>
      </div>

      <LivePreview src={homeUrl} branding={previewBranding} />

      <LogoAlert error={error} onDismiss={dismissError} />

      <PromptModal
        show={confirmRestore}
        onClose={() => setConfirmRestore(false)}
        title={t("Restore to Default")}
        message={t("Are you sure you want to restore to default state?")}
        type="warning"
        dataTestId="appearance-restore-modal"
        primaryBtnText={t("Yes, Restore to default")}
        primaryBtnAction={handleRestore}
        primaryBtndataTestid="appearance-restore-confirm"
        buttonLoading={busy}
        secondaryBtnText={t("Cancel")}
        secondaryBtnAction={() => setConfirmRestore(false)}
        secondoryBtndataTestid="appearance-restore-cancel"
        secondaryBtnDisable={busy}
      />
    </div>
  );
};

export default AppearanceTab;
