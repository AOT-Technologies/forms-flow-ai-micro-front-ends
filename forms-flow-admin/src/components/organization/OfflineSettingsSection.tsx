import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { toast } from "react-toastify";
import { Switch } from "@formsflow/components";
import * as formsflowService from "@formsflow/service";
import {
  fetchOrganizationSettings,
  saveOfflineSettings,
  OrganizationSettings,
} from "../../services/organizationSettings";
import { OFFLINE_AUTO_SYNC_ENABLED } from "../../constants";

/**
 * The organization's offline switches (FFF-3, Phase 4 part 2). Plain UI for
 * now; the final design comes in the last phase.
 *   - Offline forms: users may save forms and fill them in without internet.
 *   - Auto sync: forms filled in offline are sent by themselves when the
 *     internet is back. Only with offline forms on.
 * Each switch shows only when its env key is on (here and on the server).
 */
const OfflineSettingsSection: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const tenantKey = formsflowService.StorageService.get("tenantKey") || "";
  const queryKey = ["organization-settings", tenantKey];

  const { data, isError } = useQuery<OrganizationSettings>(
    queryKey,
    fetchOrganizationSettings
  );

  const save = useMutation(saveOfflineSettings, {
    onSuccess: (saved) => {
      queryClient.setQueryData(queryKey, saved);
      // This browser follows the new switches at once; others on next sign-in.
      // (Optional: an older @formsflow/service has no OfflineSettingsService.)
      (formsflowService as any).OfflineSettingsService?.refresh?.();
      toast.success(t("Saved"));
    },
    onError: () => {
      toast.error(t("The setting could not be saved. Please try again."));
    },
  });

  const onOfflineChange = useCallback(
    (enabled: boolean) => save.mutate({ enabled }),
    [save]
  );
  const onAutoSyncChange = useCallback(
    (autoSync: boolean) => save.mutate({ autoSync }),
    [save]
  );

  if (isError) {
    return (
      <p className="offline-settings-help" role="alert">
        {t("The offline settings could not be loaded.")}
      </p>
    );
  }
  const offline = data?.offline;
  if (!offline?.available) return null;

  return (
    <div
      className="offline-settings"
      data-testid="organization-offline-settings"
    >
      <div className="offline-settings-row">
        <Switch
          id="organization-offline-forms"
          type="primary"
          withIcon={true}
          checked={offline.enabled}
          disabled={save.isLoading}
          onChange={onOfflineChange}
          label={t("Offline forms")}
          dataTestId="organization-offline-forms-switch"
        />
        <p className="offline-settings-help">
          {t(
            "Users can save forms on their device and fill them in without internet."
          )}
        </p>
      </div>
      {OFFLINE_AUTO_SYNC_ENABLED && offline.autoSyncAvailable && (
        <div className="offline-settings-row">
          <Switch
            id="organization-offline-auto-sync"
            type="primary"
            withIcon={true}
            checked={offline.autoSync}
            disabled={save.isLoading || !offline.enabled}
            onChange={onAutoSyncChange}
            label={t("Auto sync offline submissions")}
            dataTestId="organization-offline-auto-sync-switch"
          />
          <p className="offline-settings-help">
            {offline.enabled
              ? t(
                  "Forms filled in offline are sent automatically when the internet is back."
                )
              : t("Turn on offline forms first.")}
          </p>
        </div>
      )}
    </div>
  );
};

export default OfflineSettingsSection;
