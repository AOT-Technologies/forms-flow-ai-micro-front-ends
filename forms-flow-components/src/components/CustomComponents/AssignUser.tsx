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
  currentAssignee: string;
  meOnClick?: () => void;
  optionSelect?: (userName: string) => void;
  handleCloseClick?: () => void;
  ariaLabel?: string;
  dataTestId?: string;
  manageMyTasks?:boolean;
  assignToOthers?:boolean;
  minimized?:boolean;
}

export const AssignUser: React.FC<AssignUserProps> = ({
  size = "md",
  users = [],
  currentAssignee,
  meOnClick,
  optionSelect,
  handleCloseClick,
  ariaLabel = "assign-user",
  dataTestId = "assign-user",
  assignToOthers = false,
  manageMyTasks = false,
  minimized = false,
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
    if(currentAssignee){
      setSelected("Me");
      // if username is not null or empty,set selectedName to its lastname and firstname
      const matchedUser = users.find((user) => user.username === currentAssignee);
      if (matchedUser) {
        setSelectedName(getDisplayName(matchedUser));
      }else{
        setSelectedName(currentAssignee);
      }
    } else {
      setSelected(null);
      setSelectedName(null);
    }
  }, [currentAssignee,users]);


  const handleMeClick = () => {
const fullName = userData?.family_name && userData?.given_name
  ? `${userData.family_name}, ${userData.given_name}`
  : userData?.preferred_username;

setSelected("Me");
setSelectedName(fullName);

  meOnClick?.(); 
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

const showSelector = selected === null;
  const selectedOption = selected === "Me" ? selectedName : undefined;
    //show close icons based on the user permissions
  const assignedToCurrentUser =
  selectedOption === userData.preferred_username ||
  selectedOption === `${userData.family_name}, ${userData.given_name}`;
 
  const showCloseIcon = (assignedToCurrentUser && manageMyTasks) ||(!assignedToCurrentUser && assignToOthers); 


const dropdownOptions = useMemo(() => {
  if (!Array.isArray(users)) return [];

  const filteredUsers = (!assignedToCurrentUser && manageMyTasks &&!assignToOthers)
    ? users.filter((user) => user.id === userData.sub)
    : users;
    
  return filteredUsers.map((user) => {
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
}, [users, optionSelect, assignedToCurrentUser, userData]);


  return (
    <>
      {showSelector && (manageMyTasks || assignToOthers) && (
        <div
          className={"input-select quick-select " + (minimized?'minimized':'')}
          aria-label={`${ariaLabel}-select-user-option`}
          data-testid={`${dataTestId}-select-user-option`}
        >

          <div className="empty">
            {manageMyTasks &&
              <button
                className="option-me button-reset"
                onClick={handleMeClick}
                aria-label={`${ariaLabel}-me-button`}
                data-testid={`${dataTestId}-me-button`}
              >
                {t("Me")}
              </button>
            }

            {assignToOthers &&
              <button
                className="option-others button-reset"
                onClick={handleOthersClick}
                aria-label={`${ariaLabel}-others-button`}
                data-testid={`${dataTestId}-others-button`}
              >
                {t("Others")}
              </button>
            }
          </div>
        </div>
      )}
      {/* Show InputDropdown when either Me or Others is selected */}
      {(selected === "Me" || selected === "Others")  && (
        ( !manageMyTasks && !assignToOthers) ? <label className="assigne-label">{selectedOption}</label> :
        <InputDropdown
          showCloseIcon={showCloseIcon}
          hideDropDownList={(assignedToCurrentUser && !assignToOthers) || (!assignedToCurrentUser && !manageMyTasks)}
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
          className={"quick-select "  + (minimized?'minimized':'')}
        />
      )}
    </>
  );
};
