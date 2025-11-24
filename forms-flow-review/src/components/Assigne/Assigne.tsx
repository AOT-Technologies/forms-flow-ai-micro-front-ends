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
import { useEffect, useState, useRef } from "react";



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
  // Track the last assigned user to handle stale Redux state (use ref to avoid overwriting)
  const lastAssignedUserRef = useRef<string | null>(null);
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
      // Check both Redux state and last assigned user to handle stale state
      // This handles the case where Redux state might be stale after assigning to someone else
      const hasAssigneeInState = task?.assignee && task.assignee !== userDetails?.preferred_username;
      const wasJustAssignedToOther = lastAssignedUserRef.current && 
        lastAssignedUserRef.current !== userDetails?.preferred_username && 
        lastAssignedUserRef.current !== 'me' && 
        lastAssignedUserRef.current !== 'unassigned';
      const needsUnclaim = hasAssigneeInState || wasJustAssignedToOther;
      
      if (!needsUnclaim) {
        // unassigned or already assigned to me -> claim self directly
        dispatch(claimBPMTask(taskId, userDetails?.preferred_username, refreshAfter));
        lastAssignedUserRef.current = 'me';
      } else {
        // Task is assigned to someone else -> unclaim first then claim self
        dispatch(
          unClaimBPMTask(taskId, () => {
            dispatch(claimBPMTask(taskId, userDetails?.preferred_username, refreshAfter));
            lastAssignedUserRef.current = 'me';
          })
        );
      }
      return;
    }

    // Targeting 'unassigned'
    if (newuser === 'unassigned') {
      // Always attempt unclaim to ensure backend state matches the selection
      dispatch(unClaimBPMTask(taskId, refreshAfter));
      lastAssignedUserRef.current = 'unassigned';
      return;
    }

    // Targeting specific other user
    if (newuser) {
      // Track that we're assigning to this user (optimistically, before Redux updates)
      lastAssignedUserRef.current = newuser;
      
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

  // Sync lastAssignedUserRef with Redux state when it updates (after API calls complete)
  // This ensures our ref stays in sync with the actual state
  useEffect(() => {
    if (task?.assignee) {
      const assigneeValue = task.assignee === userDetails?.preferred_username ? 'me' : task.assignee;
      lastAssignedUserRef.current = assigneeValue;
    } else {
      // Task is unassigned
      lastAssignedUserRef.current = 'unassigned';
    }
  }, [task?.assignee, userDetails?.preferred_username]);
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
          shortMeLabel={!isFromTaskDetails}
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