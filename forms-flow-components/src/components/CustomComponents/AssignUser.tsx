import React, { useEffect, useState } from "react";
import { InputDropdown } from "./InputDropdown";
import { StorageService } from "@formsflow/service";
import { useTranslation } from "react-i18next";
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string | null;
  username: string;
}

interface AssignUserProps {
  size?: "sm" | "md";
  users: User[];
  username: string;
  meOnClick?: () => void;
  optionSelect?: (userName: string) => void;
  handleCloseClick?: () => void;
  ariaLabel?: string;
  dataTestId?: string;
}

export const AssignUser: React.FC<AssignUserProps> = ({
  size = "md",
  users = [],
  username,
  meOnClick,
  optionSelect,
  handleCloseClick,
  ariaLabel = "assign-user",
  dataTestId = "assign-user",
}) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<"Me" | "Others" | null>(null);
  const [openDropdown, setOpenDropdown] = useState<boolean>(false);
  const variant = size === "sm" ? "assign-user-sm" : "assign-user-md";
  const [selectedName, setSelectedName] = useState(null);
  const userData =
  StorageService.getParsedData(StorageService.User.USER_DETAILS) ?? {};
  useEffect(() => {
    if(!username){
      setSelected(null);
    }
    else {
      setSelected("Me");
      setSelectedName(username);
    }
  }, [username])

  const handleMeClick = () => {
    setSelected("Me");
    meOnClick?.();
    if(!username){
      setSelectedName(userData.preferred_username);
    }
  };

  const handleOthersClick = () => {
    setSelected("Others");
    setOpenDropdown(true);
  };

  const handleClose = () => {
    setSelected(null);
    setOpenDropdown(false);
    handleCloseClick?.();
  };

  const options = Array.isArray(users) && users.length > 0
  ? users.map((user) => ({
      label: user.username,
      value: user.id,
      onClick: () => {
           setSelectedName(user.username);
           setOpenDropdown(false);
           optionSelect?.(user.username);
      },
    }))
  : [];
  // Determine the selected option based on the state
  const selectedOption = selected === "Me" ? selectedName : undefined;

  return (
    <>
      {/* Show Me/Others Selection if nothing is selected */}
      {selected === null && (
          <div
            className={`assign-user ${size}`}
            aria-label={`${ariaLabel}-select-user-option`}
            data-testid={`${dataTestId}-select-user-option`}
          >
            <button
              className="option-me button-reset"
              onClick={handleMeClick}
              aria-label={`${ariaLabel}-me-button`}
              data-testid={`${dataTestId}-me-button`}
            >
               {t("Me")}
            </button>
            <div className="divider"></div>
            <button
              className="option-others button-reset"
              onClick={handleOthersClick}
              aria-label={`${ariaLabel}-others-button`}
              data-testid={`${dataTestId}-others-button`}
            >
              {t("Others")}
            </button>
          </div>
      )}

      {/* Show InputDropdown when either Me or Others is selected */}
      {(selected === "Me" || selected === "Others") && (
        <InputDropdown
          Options={options}
          variant={variant}
          selectedOption={selectedOption}
          handleCloseClick={handleClose}
          openByDefault={openDropdown}
          ariaLabelforDropdown={`${ariaLabel}-dropdown-label`}
          ariaLabelforInput={`${ariaLabel}-input-dropdown`}
          dataTestIdforDropdown={`${dataTestId}-dropdown-component`}
          dataTestIdforInput={`${dataTestId}-dropdown-input`}
        />
      )}
    </>
  );
};
