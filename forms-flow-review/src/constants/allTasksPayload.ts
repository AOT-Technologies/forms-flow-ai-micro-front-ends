import { useSelector } from "react-redux";
import { UserDetail } from "../types/taskFilter";
import { defaultTaskVariable } from "./defaultTaskVariable";
import { RootState } from "../reducers";

const useAllTasksPayload = () => {
  const userDetails: UserDetail = useSelector((state: RootState) => state.task.userDetails);

  return {
    name: "All Tasks",
    criteria: {
      includeAssignedTasks: true,
      candidateGroupsExpression: "${currentUserGroups()}",
      sorting: [
        {
          sortBy: "created",
          sortOrder: "asc",
        },
      ],
    },
    variables: defaultTaskVariable,
    properties: {},
    roles: [],
    users: [userDetails.preferred_username],
    filterType: "TASK",
  };
};

export default useAllTasksPayload;
