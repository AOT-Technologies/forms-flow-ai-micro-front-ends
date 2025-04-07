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
}

export const AssignUser: React.FC<AssignUserProps> = ({
  size = "md",
  users,
}) => {
  const [selected, setSelected] = useState<"Me" | "Others" | null>(null);
  const handleMeClick = () => {
    setSelected("Me");
  };

  const handleOthersClick = () => {
    setSelected("Others");
  };

  // Map user data to dropdown options
  const options = users.map((user) => ({
    label: user.username,
    value: user.id,
    onClick: () => console.log(`Selected user: ${user.username}`),
  }));
  console.log(options);

  return (
    <div className={`assign-user ${size}`}>
      {selected === null ? (
        <>
          <div
            className={`option ${selected === "Me" ? "selected" : ""}`}
            onClick={handleMeClick}
          >
            Me
          </div>
          <div className="divider"></div>
          <div
            className={`option ${selected === "Others" ? "selected" : ""}`}
            onClick={handleOthersClick}
          >
            Others
          </div>
        </>
      ) : selected === "Me" ? (
        <div className="selected-name">Ajay krishna</div>
      ) : (
        <div>
        <InputDropdown Options={options} />
        </div>
      )}
    </div>
  );
};
