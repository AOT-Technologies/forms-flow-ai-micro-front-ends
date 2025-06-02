import React, { useState, useEffect, useRef } from "react";
import { Form } from "react-bootstrap";
import { useTranslation } from "react-i18next";

interface Permission {
  name: string;
  description: string;
  depends_on: string[];
  category: string;
  order: number;
}

interface PermissionTreeProps {
  permissions: Permission[];
  payload: {
    permissions: string[];
  };
  handlePermissionCheck: (name: string, depends_on: string[]) => void;
  setPayload: React.Dispatch<React.SetStateAction<{
    permissions: string[];
  }>>;
}

const groupByCategory = (
  permissions: Permission[]
): Record<string, Permission[]> => {
  const grouped: Record<string, Permission[]> = {};
  for (const perm of permissions) {
    const category = perm.category || "Other";
    grouped[category] ??= [];
    grouped[category].push(perm);
  }
  return grouped;
};

const PermissionTree: React.FC<PermissionTreeProps> = ({
  permissions,
  payload,
  handlePermissionCheck,
  setPayload
}) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const checkboxRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const isChecked = (name: string) => payload.permissions.includes(name);

  const groupedPermissions = groupByCategory(permissions);

  const formatCategoryLabel = (category: string): string => {
    return `Access to ${category.charAt(0).toUpperCase()}${category
      .slice(1)
      .toLowerCase()}`;
  };

  const sortPermissionsByOrder = (perms: Permission[]): Permission[] => {
    return [...perms].sort((a, b) => a.order - b.order);
  };

  const handleParentCheck = (category: string, perms: Permission[]) => {
    const checkedCount = perms.filter((perm) => isChecked(perm.name)).length;
    const allChecked = checkedCount === perms.length;
    const newPermissions = new Set(payload.permissions);

    if (allChecked) {
      perms.forEach((perm) => {
        newPermissions.delete(perm.name);
        perm.depends_on.forEach((dep) => newPermissions.delete(dep));
      });
    } else {
      perms.forEach((perm) => {
        newPermissions.add(perm.name);
        perm.depends_on.forEach((dep) => newPermissions.add(dep));
      });
    }

    setPayload((prev) => ({
      ...prev,
      permissions: Array.from(newPermissions),
    }));
  };

  useEffect(() => {
    Object.entries(groupedPermissions).forEach(([category, perms]) => {
      const parentCheckbox = checkboxRefs.current[`parent-${category}`];
      if (!parentCheckbox) return;

      const checkedCount = perms.filter((perm) => isChecked(perm.name)).length;

      if (checkedCount === perms.length) {
        parentCheckbox.checked = true;
        parentCheckbox.indeterminate = false;
      } else if (checkedCount > 0) {
        parentCheckbox.checked = false;
        parentCheckbox.indeterminate = true;
      } else {
        parentCheckbox.checked = false;
        parentCheckbox.indeterminate = false;
      }
    });
  }, [payload.permissions]);

  return (
    <div
      className="permission-tree custom-scroll"
      data-testid="permission-tree"
      aria-label="Permission Tree"
    >
      {Object.entries(groupedPermissions).map(([category, perms]) => {
        const sortedPerms = sortPermissionsByOrder(perms);
        const label = formatCategoryLabel(category);
        return (
          <div
            key={category}
            className="mb-3"
            data-testid={`permission-group-${category}`}
          >
            <Form.Check
              type="checkbox"
              id={`parent-${category}`}
              ref={(el) => (checkboxRefs.current[`parent-${category}`] = el)}
              label={t(label)}
              onChange={() => handleParentCheck(category, sortedPerms)}
              className="fw-bold"
              data-testid={`checkbox-parent-${category}`}
              aria-label={`Toggle all permissions in ${category}`}
            />

            <div className="tree-branch" data-testid={`tree-branch-${category}`}>
              {sortedPerms.map((perm, idx) => (
                <div
                  key={perm.name}
                  className={`tree-node ${
                    idx === sortedPerms.length - 1 ? "last-child" : ""
                  }`}
                  data-testid={`tree-node-${perm.name}`}
                >
                  <Form.Check
                    type="checkbox"
                    id={`child-${perm.name}`}
                    label={t(perm.description)}
                    checked={isChecked(perm.name)}
                    onChange={() =>
                      handlePermissionCheck(perm.name, perm.depends_on)
                    }
                    className="small"
                    data-testid={`checkbox-child-${perm.name}`}
                    aria-label={`Toggle permission: ${perm.description}`}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PermissionTree;
