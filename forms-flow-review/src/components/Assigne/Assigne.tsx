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
    if (newuser && newuser !== task.assignee) {
      dispatch(
        updateAssigneeBPMTask(task?.id, newuser, () => {
           //the check with size added to identify the source of component mounted.
          if (isFromTaskDetails) {
            dispatch(setTaskDetailsLoading(true));
            dispatch(getBPMTaskDetail(task?.id));
          } else {
            fetchTaskList();
          }
          if(!SocketIOService.isConnected){
          fetchTaskList();
        }
        })
      );
    }
  };

    const currentValue = !task?.assignee
      ? "unassigned"
      : task.assignee === userDetails?.preferred_username
      ? "me"
      : task.assignee;

  const userList = useSelector((state: any) => state.task?.userList);
  if (!task?.id) {
    return null;
  }

  return (
    <>
    {(() => {
      if (isFromTaskDetails) {
        return (
          // <AssignUser
          //   size={isFromTaskDetails ? 'md' : 'sm'}
          //   users={userList?.data ?? []}
          //   currentAssignee={task.assignee}
          //   meOnClick={handleClaim}
          //   optionSelect={handleChangeClaim}
          //   handleCloseClick={handleUnClaim}
          //   assignToOthers={AssignTaskToOthers}
          //   manageMyTasks={manageMyTasks}
          // />
          <UserSelect
            users={userList?.data ?? []}
            value={currentValue}
            onChange={handleChangeClaim}
            ariaLabel="task-assignee-select"
            dataTestId="task-assignee-select"
            showAsText={true}
          />
        )
      } else {
        return (
          // <AssignUser
          //   size={isFromTaskDetails ? 'md' : 'sm'}
          //   users={userList?.data ?? []}
          //   currentAssignee={task.assignee}
          //   meOnClick={handleClaim}
          //   optionSelect={handleChangeClaim}
          //   handleCloseClick={handleUnClaim}
          //   assignToOthers={AssignTaskToOthers}
          //   manageMyTasks={manageMyTasks}
          //   minimized
          // />

          <UserSelect
            users={userList?.data ?? []}
            value={currentValue}
            onChange={handleChangeClaim}
            ariaLabel="task-assignee-select"
            dataTestId="task-assignee-select"
            showAsText={true}
          />
        )
      }
  
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