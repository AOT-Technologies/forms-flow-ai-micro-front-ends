import React, { useEffect, useState, useMemo } from "react";
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
  const [openDropdown, setOpenDropdown] = useState(false);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const variant = size === "sm" ? "assign-user-sm" : "assign-user-md";
  const userData =
    StorageService.getParsedData(StorageService.User.USER_DETAILS) ?? {};

  const getDisplayName = (user) => {
    if (user.firstName && user.lastName)
      return `${user.lastName}, ${user.firstName}`;
    if (user.lastName) return user.lastName;
    if (user.firstName) return user.firstName;
    return user.username;
  };

  useEffect(() => {
    if(username){
      setSelected("Me");
      // if username is not null or empty,set selectedName to its lastname and firstname
      const matchedUser = users.find((user) => user.username === username);
      if (matchedUser) {
        setSelectedName(getDisplayName(matchedUser));
      }else{
        setSelectedName(username);
      }
    } else {
      setSelected(null);
      setSelectedName(null);
    }
  }, [username,users]);


  const handleMeClick = () => {
    const name = username ?? userData?.preferred_username;
    setSelected("Me");
    setSelectedName(name);
    meOnClick?.();
    if(!username){
      setSelectedName(`${userData.family_name}, ${userData.given_name}`);
    }
  };

  const handleOthersClick = () => {
    setSelected("Others");
    setOpenDropdown(true);
  };

  const handleDropdownClose = () => {
    setSelected(null);
    setSelectedName(null);
    setOpenDropdown(false);
    handleCloseClick?.();
  };

const dropdownOptions = useMemo(() => {
  if (Array.isArray(users)) {
    return users.map((user) => {
      const fullName = getDisplayName(user);
      const label = user.email ? `${fullName} (${user.email})` : fullName;
      return {
        label,
        value: user.id,
        onClick: () => {
          setSelectedName(fullName);
          optionSelect?.(user.username);
          setOpenDropdown(false);
        },
      };
    });
  }
  return [];
}, [users, optionSelect]);


  const showSelector = selected === null;
  const selectedOption = selected === "Me" ? selectedName : undefined;

  return (
    <>
      {showSelector && (
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
          Options={dropdownOptions}
          variant={variant}
          selectedOption={selectedOption}
          handleCloseClick={handleDropdownClose}
          openByDefault={openDropdown}
          ariaLabelforDropdown={`${ariaLabel}-dropdown-label`}
          ariaLabelforInput={`${ariaLabel}-input-dropdown`}
          dataTestIdforDropdown={`${dataTestId}-dropdown-component`}
          dataTestIdforInput={`${dataTestId}-dropdown-input`}
          onBlurDropDown={() => {
            setTimeout(() => {
              if (!selectedName) {
                setSelected(null);
                setOpenDropdown(false);
              }
            }, 150);
          }}
        />
      )}
    </>
  );
};
