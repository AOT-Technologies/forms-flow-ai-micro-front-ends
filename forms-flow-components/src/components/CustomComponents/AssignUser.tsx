import React, { useState } from "react";
import { InputDropdown } from "./InputDropdown";
import { CloseIcon } from "../SvgIcons/index";
import { StyleServices } from "@formsflow/service";

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
  othersOnClick?: () => void;
  optionSelect?: (userId: string) => void;
  handleCloseClick?: () => void;
}

export const AssignUser: React.FC<AssignUserProps> = ({
  size = "md",
  users,
  username,
  meOnClick,
  othersOnClick,
  optionSelect,
  handleCloseClick,
}) => {
  const [selected, setSelected] = useState<"Me" | "Others" | null>(null);
  const [openDropdown, setOpenDropdown] = useState<boolean>(false);
  const variant = size === "sm" ? "assign-user-sm" : "assign-user-md";
  const handleMeClick = () => {
    setSelected("Me");
    meOnClick?.();
    
    // Auto-select the current user when "Me" is clicked
    const currentUser = users.find(user => user.username === username);
    if (currentUser && optionSelect) {
      optionSelect(currentUser.id);
    }
  };

  const handleOthersClick = () => {
    setSelected("Others");
    setOpenDropdown(true);
    othersOnClick?.();
  };

  const handleClose = () => {
    setSelected(null);
    setOpenDropdown(false);
    handleCloseClick?.();
  };

  const options = users.map((user) => ({
    label: user.username,
    value: user.id,
    onClick: () => {
      if (optionSelect) {
        optionSelect(user.id);
      }
    },
  }));

  // Determine the selected option based on the state
  const selectedOption = selected === "Me" ? username : undefined;

  return (
    <>
      {/* Show Me/Others Selection if nothing is selected */}
      {selected === null && (
        <div className={`assign-user ${size}`}>
          <div className="option-me" onClick={handleMeClick}>
            Me
          </div>
          <div className="option-others" onClick={handleOthersClick}>
            Others
          </div>
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
        />
      )}
    </>
  );
};