// import { AssignUser } from "@formsflow/components";
import { UserSelect } from "@formsflow/components";
import { useDispatch, useSelector } from "react-redux";
import {
  claimBPMTask,
  fetchBPMTaskCount,
  fetchServiceTaskList,
  unClaimBPMTask,
  updateAssigneeBPMTask,
} from "../../api/services/filterServices";
import {  setTaskDetailsLoading } from "../../actions/taskActions";
import { getBPMTaskDetail } from "../../api/services/bpmTaskServices";
import SocketIOService from "../../services/SocketIOService";
import { userRoles } from "../../helper/permissions";
import { useEffect, useState } from "react";



const TaskAssigneeManager = ({ task, isFromTaskDetails=false, minimized=false }) => {
  const dispatch = useDispatch();
  const taskId = task?.id;
  const {
    filterList,
    userDetails,
    lastRequestedPayload: lastReqPayload,
    activePage,
    limit,
  } = useSelector((state: any) => state.task);

  const { manageMyTasks,AssignTaskToOthers } = userRoles();
  // Optimistic value to immediately reflect selection in UI
  const [overrideValue, setOverrideValue] = useState<string | null>(null);
  const fetchTaskList = () => {
    dispatch(fetchServiceTaskList(lastReqPayload, null, activePage, limit));
  };
  const callTaskListcountApi = () => {
    dispatch(fetchBPMTaskCount(filterList));
  };

  const handleClaim = () => {
    /**
     * Claiming a task will assign it to the user who is currently logged in. and don't need to call the tasklist api again
     * but we need to update tasklist count by calling the count api
     */
    dispatch(
      claimBPMTask(taskId, userDetails?.preferred_username, () => {
        //the check with size added to identify the source of component mounted.
        if (isFromTaskDetails) {
          dispatch(setTaskDetailsLoading(true));
          dispatch(getBPMTaskDetail(task?.id));
        } else {
          callTaskListcountApi();
        }
      })
    );
  };

  const handleUnClaim = () => {
    dispatch(
      unClaimBPMTask(taskId, () => {
         //the check with size added to identify the source of component mounted.
        if (isFromTaskDetails) {
          dispatch(setTaskDetailsLoading(true));
          dispatch(getBPMTaskDetail(task?.id));
        } else {
          callTaskListcountApi();
        }
        if(!SocketIOService.isConnected){
          fetchTaskList();
        }
      })
    );
  };

  const handleChangeClaim = (newuser: string) => {
    // Optimistically update the UI label
    setOverrideValue(newuser);
    const currentValue = !task?.assignee
      ? 'unassigned'
      : task.assignee === userDetails?.preferred_username
      ? 'me'
      : task.assignee;

    const refreshAfter = () => {
      if (isFromTaskDetails) {
        dispatch(setTaskDetailsLoading(true));
        dispatch(getBPMTaskDetail(task?.id));
      } else {
        fetchTaskList();
        callTaskListcountApi();
      }
      if (!SocketIOService.isConnected) {
        fetchTaskList();
      }
    };

    // Targeting 'me'
    if (newuser === 'me') {
      if (currentValue === 'unassigned') {
        // unassigned -> claim self
        dispatch(claimBPMTask(taskId, userDetails?.preferred_username, refreshAfter));
      } else {
        // if current is 'me' or any other user -> unclaim first then claim self
        dispatch(
          unClaimBPMTask(taskId, () => {
            dispatch(claimBPMTask(taskId, userDetails?.preferred_username, refreshAfter));
          })
        );
      }
      return;
    }

    // Targeting 'unassigned'
    if (newuser === 'unassigned') {
      // Always attempt unclaim to ensure backend state matches the selection
      dispatch(unClaimBPMTask(taskId, refreshAfter));
      return;
    }

    // Targeting specific other user
    if (newuser) {
      if (currentValue === 'me') {
        // me -> other user: unclaim then assign to new user
        dispatch(
          unClaimBPMTask(taskId, () => {
            dispatch(
              updateAssigneeBPMTask(task?.id, newuser, refreshAfter)
            );
          })
        );
        return;
      }
      if (currentValue === 'unassigned') {
        // unassigned -> assign directly to new user
        dispatch(updateAssigneeBPMTask(task?.id, newuser, refreshAfter));
        return;
      }
      // other user -> even if selecting the same user, force update to ensure backend state aligns
      dispatch(updateAssigneeBPMTask(task?.id, newuser, refreshAfter));
    }
  };

    const currentValue = !task?.assignee
      ? "unassigned"
      : task.assignee === userDetails?.preferred_username
      ? "me"
      : task.assignee;

  const userList = useSelector((state: any) => state.task?.userList);
  const displayedValue = overrideValue ?? currentValue;
  // Clear override once the store reflects the chosen value
  useEffect(() => {
    if (overrideValue && overrideValue === currentValue) {
      setOverrideValue(null);
    }
  }, [currentValue, overrideValue]);
  if (!task?.id) {
    return null;
  }

  return (
    <>
    {(() => {
      return(
        <UserSelect
          users={userList?.data ?? []}
          value={displayedValue}
          onChange={handleChangeClaim}
          ariaLabel="task-assignee-select"
          dataTestId="task-assignee-select"
          showAsText={true}
        />
      )
    })()}
    </>
    
    // <AssignUser
    //   size={isFromTaskDetails ? 'md' : 'sm'}
    //   isFromTaskDetails={isFromTaskDetails}
    //   users={userList?.data ?? []}
    //   currentAssignee={task.assignee}
    //   meOnClick={handleClaim}
    //   optionSelect={handleChangeClaim}
    //   handleCloseClick={handleUnClaim}
    //   assignToOthers={AssignTaskToOthers}
    //   manageMyTasks={manageMyTasks}
    //   minimized
    // />
  );
};

export default TaskAssigneeManager;