import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import GovernedContentList from "./GovernedContentList";
import GovernedContentForm, { NEW_BLOCK_ID } from "./GovernedContentForm";
import "./governedContent.scss";

interface GovernedContentProps {
  // The Content tab's route, e.g. "/tenant/abc/admin/content".
  basePath: string;
  // From the "content/:blockId" route: NEW_BLOCK_ID or a block id.
  blockId?: string;
  // Whether governed content is on for the tenant; while off the library is
  // read-only (REV 4.1 / 4.5).
  enabled?: boolean;
  // Where the "Go to Organization" link leads; omitted when the user can't
  // open the Organization tab.
  organizationPath?: string;
}

const GovernedContent: React.FC<GovernedContentProps> = ({
  basePath,
  blockId,
  enabled = true,
  organizationPath,
}) => {
  const navigate = useNavigate();
  const openList = useCallback(() => navigate(basePath), [navigate, basePath]);
  const openCreate = useCallback(
    () => navigate(`${basePath}/${NEW_BLOCK_ID}`),
    [navigate, basePath]
  );
  const openEdit = useCallback(
    (id: number) => navigate(`${basePath}/${id}`),
    [navigate, basePath]
  );
  const openOrganization = useCallback(() => {
    if (organizationPath) navigate(organizationPath);
  }, [navigate, organizationPath]);

  // While off, a new block can't be started; an existing one opens read-only.
  if (blockId && (enabled || blockId !== NEW_BLOCK_ID)) {
    // Keyed so moving between blocks starts from a fresh form.
    return (
      <GovernedContentForm
        key={blockId}
        blockId={blockId}
        onClose={openList}
        readOnly={!enabled}
      />
    );
  }
  return (
    <GovernedContentList
      onCreate={openCreate}
      onEdit={openEdit}
      readOnly={!enabled}
      onOpenOrganization={organizationPath ? openOrganization : undefined}
    />
  );
};

export { NEW_BLOCK_ID };
export default GovernedContent;
