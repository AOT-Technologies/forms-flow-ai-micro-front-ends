import React, { useState, useEffect, useRef, useMemo } from "react";
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

  const groupedPermissions = useMemo(
    () => groupByCategory(permissions),
    [permissions]
    );

const formatCategoryLabel = (category: string): string => {
  if (category.toLowerCase() === "admin") {
    return "Access to Manage";
  }
  return `Access to ${category.charAt(0).toUpperCase()}${category.slice(1).toLowerCase()}`;
};

  const sortPermissionsByOrder = (perms: Permission[]): Permission[] => {
    return [...perms].sort((a, b) => a.order - b.order);
  };

  const removePermissionAndDeps = (perm: Permission, permissionsSet: Set<string>) => {
    permissionsSet.delete(perm.name);
    perm.depends_on.forEach(dep => permissionsSet.delete(dep));
  };
  
  const addPermissionAndDeps = (perm: Permission, permissionsSet: Set<string>) => {
    permissionsSet.add(perm.name);
    perm.depends_on.forEach(dep => permissionsSet.add(dep));
  };

  const handleParentCheck = (category: string, perms: Permission[]) => {
    setPayload(prev => {
      const newPermissions = new Set(prev.permissions);
      const allChecked = perms.every(perm => newPermissions.has(perm.name));
      
      const updatePermissions = (perm: Permission) => {
        allChecked 
          ? removePermissionAndDeps(perm, newPermissions)
          : addPermissionAndDeps(perm, newPermissions);
      };

      perms.forEach(updatePermissions);
      
      return {
        ...prev,
        permissions: Array.from(newPermissions)
      };
    });
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
      className="permission-tree"
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
                    disabled
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
