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
    if(username){
      setSelected("Me");
      // if username is not null or empty,set selectedName to its lastname and firstname
      const matchedUser = users.find((user) => user.username === username);
      if (matchedUser && matchedUser.firstName && matchedUser.lastName){
        setSelectedName(`${matchedUser.lastName}, ${matchedUser.firstName}`);
      }else{
        setSelectedName(username);
      }
    } else {
      setSelected(null);
      setSelectedName(null);
    }
  }, [username,users]);
  
  const handleMeClick = () => {
    setSelected("Me");
    meOnClick?.();
    if(!username){
      setSelectedName(`${userData.family_name}, ${userData.given_name}`);
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

 const options = Array.isArray(users) 
  ? users?.map((user) => {
      const hasFullName = user.firstName && user.lastName;
      const label = hasFullName 
        ? `${user.lastName}, ${user.firstName} (${user.email})` 
        : user.username;

      const fullName = hasFullName 
        ? `${user.lastName}, ${user.firstName}` 
        : user.username;

      return {
        label,
        value: user.id,
        onClick: () => {
          setSelectedName(fullName);
          optionSelect?.(user.username);
          setOpenDropdown(false);
        },
      };
    })
  : [];

  // Determine the selected option based on the state
  const selectedOption =  selectedName ?? undefined;

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
