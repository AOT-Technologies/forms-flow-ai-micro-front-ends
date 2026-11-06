import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { PromptModal, SwitchCard } from "@formsflow/components";
import { updateGovernedContentSetting } from "../../services/organization";
import {
  GovernedContentRecord,
  fetchGovernedContentList,
  getApiErrorMessage,
} from "../../services/governedContent";
import { isRetired } from "../governedContent/governedBlock";

// Figma REV 4.2 / 4.3 (the switch), REV 4.4 (turning off), REV 4.6 (turning
// back on). Both directions are confirmed before the setting is saved.

interface GovernedContentSettingSectionProps {
  tenantKey: string;
  enabled: boolean;
  // Refetches the tenant record so `enabled` reflects what was saved.
  onSaved: () => void;
}

// null while no dialog is open; otherwise the value being confirmed.
type PendingChange = { enabled: boolean; requiredCount: number | null } | null;

const countActiveRequired = (records: GovernedContentRecord[]) =>
  records.filter(
    (record) => !isRetired(record) && record.requirement === "required"
  ).length;

export const GovernedContentSettingSection: React.FC<
  GovernedContentSettingSectionProps
> = ({ tenantKey, enabled, onSaved }) => {
  const { t } = useTranslation();
  const [pending, setPending] = useState<PendingChange>(null);
  const [saving, setSaving] = useState(false);
  // Switch keeps its own state and flips on click, resyncing only when
  // `checked` changes. `enabled` changes only after a save, so the card is
  // remounted on each click to keep showing the saved state (REV 4.4 / 4.6).
  const [switchKey, setSwitchKey] = useState(0);

  // Turning on states how many required blocks will reach every form, so the
  // library is counted first; the dialog still opens if that count fails.
  const handleSwitch = useCallback((checked: boolean) => {
    setSwitchKey((key) => key + 1);
    if (!checked) {
      setPending({ enabled: false, requiredCount: null });
      return;
    }
    fetchGovernedContentList()
      .then((records) =>
        setPending({
          enabled: true,
          requiredCount: countActiveRequired(records),
        })
      )
      .catch((err) => {
        console.error("Failed to count required governed content:", err);
        setPending({ enabled: true, requiredCount: null });
      });
  }, []);

  const close = useCallback(() => {
    if (!saving) setPending(null);
  }, [saving]);

  const save = useCallback(() => {
    if (!pending) return;
    setSaving(true);
    updateGovernedContentSetting(tenantKey, pending.enabled)
      .then(() => {
        toast.success(
          pending.enabled
            ? t("Governed content turned on")
            : t("Governed content turned off")
        );
        setPending(null);
        onSaved();
      })
      .catch((err) =>
        toast.error(
          getApiErrorMessage(
            err,
            t("The setting could not be saved. Please try again.")
          )
        )
      )
      .finally(() => setSaving(false));
  }, [onSaved, pending, t, tenantKey]);

  const turnOnMessage = () => {
    const count = pending?.requiredCount;
    let first = t(
      "Required blocks you create are added to every form the next time someone opens and saves it."
    );
    if (count === 1) {
      first = t(
        "Your library has 1 required block. It’ll be required on every form, and each form picks it up the next time someone opens and saves it."
      );
    } else if (count) {
      first = t(
        "Your library has {{count}} required blocks. They’ll be required on every form, and each form picks them up the next time someone opens and saves it.",
        { count }
      );
    }
    return (
      <>
        <p>{first}</p>
        <p>{t("Optional blocks become available again in each form.")}</p>
      </>
    );
  };

  return (
    <div
      className="governed-content-setting"
      data-testid="organization-governed-content"
    >
      <SwitchCard
        key={switchKey}
        id="organization-governed-content-switch"
        checked={enabled}
        onChange={handleSwitch}
        label={
          enabled ? t("Governed content is on") : t("Governed content is off")
        }
        description={
          enabled
            ? t(
                "Required blocks are added to new forms, and designers can add optional blocks from a form’s Content tab."
              )
            : t(
                "Turn on to create approved wording, like privacy notices, that is added to forms automatically."
              )
        }
        dataTestId="organization-governed-content"
      />

      <PromptModal
        show={pending?.enabled === false}
        onClose={close}
        title={t("Turn off governed content?")}
        message={
          <>
            <p>
              {t(
                "Blocks already on forms stay there, locked. New forms won’t get governed content, and designers won’t see the Content tab on them."
              )}
            </p>
            <p>
              {t(
                "If you turn it back on, required blocks reach each form the next time it’s opened and saved."
              )}
            </p>
          </>
        }
        type="danger"
        primaryBtnText={t("Turn off")}
        primaryBtnAction={save}
        primaryBtndataTestid="governed-setting-turn-off"
        buttonLoading={saving}
        secondaryBtnText={t("Cancel")}
        secondaryBtnAction={close}
        secondoryBtndataTestid="governed-setting-turn-off-cancel"
        secondaryBtnDisable={saving}
        dataTestId="governed-setting-turn-off-modal"
      />

      <PromptModal
        show={pending?.enabled === true}
        onClose={close}
        title={t("Turn on governed content?")}
        message={turnOnMessage()}
        primaryBtnText={t("Turn on")}
        primaryBtnAction={save}
        primaryBtndataTestid="governed-setting-turn-on"
        buttonLoading={saving}
        secondaryBtnText={t("Cancel")}
        secondaryBtnAction={close}
        secondoryBtndataTestid="governed-setting-turn-on-cancel"
        secondaryBtnDisable={saving}
        dataTestId="governed-setting-turn-on-modal"
      />
    </div>
  );
};

export default GovernedContentSettingSection;
