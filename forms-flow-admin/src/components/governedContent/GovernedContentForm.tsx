import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import {
  CustomInfo,
  CustomRadioButton,
  FormInput,
  PromptModal,
  V8CustomButton,
} from "@formsflow/components";
import Loading from "../loading";
import RichTextEditor from "./RichTextEditor";
import GovernedContentPreview from "./GovernedContentPreview";
import GovernedContentView from "./GovernedContentView";
import {
  EMPTY_BLOCK_DRAFT,
  GovernedBlockDraft,
  REQUIREMENT_LABELS,
  isBlockDraftComplete,
  isRetired,
  isSameBlockDraft,
  toBlockDraft,
  toGovernedPayload,
} from "./governedBlock";
import {
  GovernedContentRecord,
  GovernedRequirement,
  NAME_EXISTS_ERROR,
  createGovernedContent,
  fetchGovernedContent,
  getApiErrorCode,
  getApiErrorMessage,
  retireGovernedContent,
  updateGovernedContent,
} from "../../services/governedContent";

// Figma REV 1.3–1.6 (new block, confirm on create), REV 1.8 (unsaved changes)
// and REV 2.2–2.4 (edit block: change confirmation, retire from the page).
// Retired blocks can't be edited and open read-only (REV 3.5), as does every
// block while governed content is off (REV 4).

export const NEW_BLOCK_ID = "new";

const NAME_MAX_LENGTH = 200;

const REQUIREMENT_OPTIONS = (
  Object.keys(REQUIREMENT_LABELS) as GovernedRequirement[]
).map((value) => ({ label: REQUIREMENT_LABELS[value], value }));

interface GovernedContentFormProps {
  // NEW_BLOCK_ID, or the id of the block to edit.
  blockId: string;
  // Back to the library.
  onClose: () => void;
  // Governed content is off: blocks open read-only (REV 4).
  readOnly?: boolean;
}

const GovernedContentForm: React.FC<GovernedContentFormProps> = ({
  blockId,
  onClose,
  readOnly = false,
}) => {
  const { t } = useTranslation();
  const isNew = blockId === NEW_BLOCK_ID;
  const [record, setRecord] = useState<GovernedContentRecord | null>(null);
  const [initialDraft, setInitialDraft] =
    useState<GovernedBlockDraft>(EMPTY_BLOCK_DRAFT);
  const [draft, setDraft] = useState<GovernedBlockDraft>(EMPTY_BLOCK_DRAFT);
  const [loading, setLoading] = useState(!isNew);
  const [loadError, setLoadError] = useState("");
  const [nameError, setNameError] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmRequired, setConfirmRequired] = useState(false);
  const [confirmSave, setConfirmSave] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmRetire, setConfirmRetire] = useState(false);
  const [retiring, setRetiring] = useState(false);

  useEffect(() => {
    if (isNew) return undefined;
    let cancelled = false;
    fetchGovernedContent(blockId)
      .then((data) => {
        if (cancelled) return;
        const loaded = toBlockDraft(data);
        setRecord(data);
        setInitialDraft(loaded);
        setDraft(loaded);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(
          getApiErrorMessage(err, t("This block could not be loaded."))
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [blockId, isNew, t]);

  const isDirty = !isSameBlockDraft(draft, initialDraft);
  const canSave =
    isDirty && isBlockDraftComplete(draft) && !saving && !retiring;

  useEffect(() => {
    if (!isDirty) return undefined;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  const update = (patch: Partial<GovernedBlockDraft>) =>
    setDraft((prev) => ({ ...prev, ...patch }));

  const handleBodyChange = useCallback(
    (body: string) => setDraft((prev) => ({ ...prev, body })),
    []
  );

  const handleRequirementChange = useCallback(
    (requirement: GovernedBlockDraft["requirement"]) =>
      setDraft((prev) => ({ ...prev, requirement })),
    []
  );

  const requirementOptions = useMemo(
    () =>
      REQUIREMENT_OPTIONS.map((option) => ({
        ...option,
        label: t(option.label),
      })),
    [t]
  );

  const save = () => {
    setSaving(true);
    setNameError("");
    const payload = toGovernedPayload(draft, record?.component);
    const request = record
      ? updateGovernedContent(record.id, payload)
      : createGovernedContent(payload);
    request
      .then(() => {
        toast.success(
          record
            ? t("Block updated successfully")
            : t("Block created successfully")
        );
        onClose();
      })
      .catch((err) => {
        setSaving(false);
        setConfirmRequired(false);
        setConfirmSave(false);
        const message = getApiErrorMessage(
          err,
          t("The block could not be saved. Please try again.")
        );
        if (getApiErrorCode(err) === NAME_EXISTS_ERROR) setNameError(message);
        else toast.error(message);
      });
  };

  // A new required block lands on every form, and an edit reaches every form
  // carrying the block, so both are confirmed first.
  const handleSubmit = () => {
    if (!canSave) return;
    if (!isNew) setConfirmSave(true);
    else if (draft.requirement === "required") setConfirmRequired(true);
    else save();
  };

  const retire = () => {
    if (!record) return;
    setRetiring(true);
    retireGovernedContent(record.id)
      .then(() => {
        toast.success(t("Block retired successfully"));
        onClose();
      })
      .catch((err) => {
        setRetiring(false);
        setConfirmRetire(false);
        toast.error(
          getApiErrorMessage(
            err,
            t("The block could not be retired. Please try again.")
          )
        );
      });
  };

  const handleCancel = () => (isDirty ? setConfirmLeave(true) : onClose());

  if (loading) return <Loading />;

  if (loadError) {
    return (
      <div className="ff-governed-form__error" role="alert">
        <p data-testid="governed-form-load-error">{loadError}</p>
        <V8CustomButton
          label={t("Back to content")}
          variant="secondary"
          onClick={onClose}
          dataTestId="governed-form-back"
        />
      </div>
    );
  }

  if (record && (readOnly || isRetired(record))) {
    return <GovernedContentView record={record} draft={initialDraft} />;
  }

  return (
    <div className="ff-governed-form" data-testid="governed-content-form">
      <h2 className="ff-governed-form__title">
        {isNew ? t("New block") : t("Edit block")}
      </h2>

      {!isNew && (
        <CustomInfo
          className="ff-governed-form__notice"
          variant="primary"
          content={t(
            "Changes reach each form the next time someone opens and saves it."
          )}
          dataTestId="governed-form-notice"
        />
      )}

      <div className="ff-governed-form__layout">
        <div className="ff-governed-form__fields">
          <div className="ff-governed-form__field">
            <FormInput
              id="governed-name"
              label={t("Name")}
              required
              value={draft.name}
              onChange={(e) => {
                update({ name: e.target.value });
                setNameError("");
              }}
              maxLength={NAME_MAX_LENGTH}
              isInvalid={Boolean(nameError)}
              feedback={nameError}
              dataTestId="governed-name-input"
            />
            <p className="ff-governed-form__hint">
              {t("Block identifier. Not shown on forms.")}
            </p>
          </div>

          <div className="ff-governed-form__field">
            <FormInput
              id="governed-heading"
              label={t("Heading")}
              value={draft.heading}
              onChange={(e) => update({ heading: e.target.value })}
              dataTestId="governed-heading-input"
            />
            <p className="ff-governed-form__hint">
              {t("Shown to submitters above the body.")}
            </p>
          </div>

          <div className="ff-governed-form__field">
            <span
              id="governed-body-label"
              className="custom-form-control-label"
            >
              {t("Body")}
              <span className="required-icon">*</span>
            </span>
            <RichTextEditor
              id="governed-body"
              value={draft.body}
              onChange={handleBodyChange}
              labelId="governed-body-label"
              describedById="governed-body-hint"
              dataTestId="governed-body-editor"
            />
            <p id="governed-body-hint" className="ff-governed-form__hint">
              {t("Enter the wording exactly as it was approved.")}
            </p>
          </div>

          <div className="ff-governed-form__row">
            <div className="ff-governed-form__field">
              <FormInput
                id="governed-owner"
                label={t("Owner")}
                required
                value={draft.owner}
                onChange={(e) => update({ owner: e.target.value })}
                dataTestId="governed-owner-input"
              />
              <p className="ff-governed-form__hint">
                {t("Who designers contact to request a change.")}
              </p>
            </div>
            <div className="ff-governed-form__field">
              <FormInput
                id="governed-policy-reference"
                label={t("Policy reference")}
                value={draft.policyReference}
                onChange={(e) => update({ policyReference: e.target.value })}
                dataTestId="governed-policy-reference-input"
              />
              <p className="ff-governed-form__hint">
                {t("Optional. The policy this wording comes from.")}
              </p>
            </div>
          </div>

          <div className="ff-governed-form__field">
            <span
              id="governed-type-label"
              className="custom-form-control-label"
            >
              {t("Type")}
              <span className="required-icon">*</span>
            </span>
            <CustomRadioButton
              name="governed-requirement"
              items={requirementOptions}
              selectedValue={draft.requirement}
              onChange={handleRequirementChange}
              inline={false}
              required
              aria-labelledby="governed-type-label"
              className="ff-governed-form__requirement"
              dataTestId="governed-requirement"
            />
          </div>
        </div>

        <GovernedContentPreview heading={draft.heading} body={draft.body} />
      </div>

      <div className="ff-governed-form__buttons">
        <div className="ff-governed-form__button-group">
          <V8CustomButton
            label={t("Cancel")}
            variant="secondary"
            onClick={handleCancel}
            disabled={saving || retiring}
            dataTestId="governed-form-cancel"
          />
          <V8CustomButton
            label={isNew ? t("Create block") : t("Save changes")}
            variant="primary"
            onClick={handleSubmit}
            disabled={!canSave}
            loading={saving && !confirmRequired && !confirmSave}
            dataTestId="governed-form-submit"
          />
        </div>
        {record && (
          <V8CustomButton
            label={t("Retire block")}
            variant="error"
            onClick={() => setConfirmRetire(true)}
            disabled={saving || retiring}
            dataTestId="governed-form-retire"
          />
        )}
      </div>

      <PromptModal
        show={confirmRequired}
        onClose={() => !saving && setConfirmRequired(false)}
        title={t("Create a required block?")}
        message={
          <>
            <p>
              {t(
                "{{name}} will be required on every form. Each one picks it up the next time someone opens and saves it.",
                { name: draft.name.trim() }
              )}
            </p>
            <p>
              {t(
                "Designers can’t edit or remove it. Forms not saved since won’t carry it until they are."
              )}
            </p>
          </>
        }
        primaryBtnText={t("Create block")}
        primaryBtnAction={save}
        primaryBtndataTestid="governed-confirm-required-create"
        buttonLoading={saving}
        secondaryBtnText={t("Cancel")}
        secondaryBtnAction={() => setConfirmRequired(false)}
        secondoryBtndataTestid="governed-confirm-required-cancel"
        secondaryBtnDisable={saving}
        dataTestId="governed-confirm-required-modal"
      />

      <PromptModal
        show={confirmSave}
        onClose={() => !saving && setConfirmSave(false)}
        title={t("Save this change?")}
        message={t(
          "Each form carrying this block picks up the new text the next time someone opens and saves it."
        )}
        primaryBtnText={t("Save change")}
        primaryBtnAction={save}
        primaryBtndataTestid="governed-confirm-save"
        buttonLoading={saving}
        secondaryBtnText={t("Cancel")}
        secondaryBtnAction={() => setConfirmSave(false)}
        secondoryBtndataTestid="governed-confirm-save-cancel"
        secondaryBtnDisable={saving}
        dataTestId="governed-confirm-save-modal"
      />

      <PromptModal
        show={confirmRetire}
        onClose={() => !retiring && setConfirmRetire(false)}
        title={t("Retire this block?")}
        message={t(
          "{{name}} is removed from each form carrying it the next time that form is opened and saved.",
          { name: record?.name ?? "" }
        )}
        type="danger"
        primaryBtnText={t("Retire")}
        primaryBtnAction={retire}
        primaryBtndataTestid="governed-confirm-retire"
        buttonLoading={retiring}
        secondaryBtnText={t("Cancel")}
        secondaryBtnAction={() => setConfirmRetire(false)}
        secondoryBtndataTestid="governed-confirm-retire-cancel"
        secondaryBtnDisable={retiring}
        dataTestId="governed-confirm-retire-modal"
      />

      <PromptModal
        show={confirmLeave}
        onClose={() => setConfirmLeave(false)}
        title={t("You have unsaved changes")}
        message={t(
          "Leaving this page will discard any unsaved changes. Are you sure you want to continue?"
        )}
        primaryBtnText={t("Keep editing")}
        primaryBtnAction={() => setConfirmLeave(false)}
        primaryBtndataTestid="governed-unsaved-keep-editing"
        secondaryBtnText={t("Discard changes")}
        secondaryBtnAction={onClose}
        secondoryBtndataTestid="governed-unsaved-discard"
        dataTestId="governed-unsaved-modal"
      />
    </div>
  );
};

export default GovernedContentForm;
