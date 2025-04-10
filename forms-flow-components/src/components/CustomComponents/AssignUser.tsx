import React, { useState } from "react";
import { InputDropdown } from "./InputDropdown";

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
  optionSelect?: () => void;
}

export const AssignUser: React.FC<AssignUserProps> = ({
  size = "md",
  users,
  username,
  meOnClick,
  othersOnClick,
  optionSelect,
}) => {
  const [selected, setSelected] = useState<"Me" | "Others" | null>(null);
  const [hoverSide, setHoverSide] = useState<"left" | "right" | null>(null);
  const variant = size === "sm" ? "assign-user-sm" : "assign-user-md"
  const handleMeClick = () => {
    setSelected("Me");
    meOnClick?.();
  };

  const handleOthersClick = () => {
    setSelected("Others");
    othersOnClick?.();
  };

  const options = users.map((user) => ({
    label: user.username,
    value: user.id,
    onClick: () => console.log(`Selected user: ${user.username}`),
  }));

  return (
    <>
      {/* Show Me/Others Selection if not Others */}
      {selected !== "Others" && (
        <div className={`assign-user ${size}`} data-hover-side={hoverSide}>
          {selected === null ? (
            <>
              <div
                className={`option ${hoverSide === "left" ? "left-selected" : ""}`}
                onClick={handleMeClick}
                onMouseEnter={() => setHoverSide("left")}
                onMouseLeave={() => setHoverSide(null)}
              >
                Me
              </div>
              <div className="divider"></div>
              <div
                className={`option ${hoverSide === "right" ? "right-selected" : ""}`}
                onClick={handleOthersClick}
                onMouseEnter={() => setHoverSide("right")}
                onMouseLeave={() => setHoverSide(null)}
              >
                Others
              </div>
            </>
          ) : (
            <div className="selected-name">{username}</div>
          )}
        </div>
      )}

      {/* Show dropdown alone if Others selected */}
      {selected === "Others" && (
          <InputDropdown Options={options} variant={variant}/>
      )}
    </>
  );
};
