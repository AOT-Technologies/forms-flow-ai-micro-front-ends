import { AssignUser } from '@formsflow/components';
import React, { useCallback } from 'react'; 
import { useSelector } from 'react-redux';
 

const TaskAssigneeManager = ({
  task,
}) => {
 // we can fetch user list here
 // we can access reqData from here
 // we can fetch firstresult form here
 // we can handle user data form here
 // we can have limit here
// Early return if required props are missing


  const userList = useSelector((state: any) => state.task?.userList);
  if (!task?.id) {
    return null;
  }

  return (
    <AssignUser
      size="sm"
      users={userList?.data ?? []}
      username={task.assignee}
    //   meOnClick={handleClaim}
    //   optionSelect={handleChangeClaim}
    //   handleCloseClick={handleUnClaim}
    />
  );
};

export default TaskAssigneeManager;