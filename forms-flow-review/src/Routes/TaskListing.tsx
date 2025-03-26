import { useEffect, useCallback, useState } from "react";
import SocketIOService from "../services/SocketIOService";
import { CustomButton } from '@formsflow/components'; 
import TaskFilterModal from "../components/TaskFilterModal";

interface SocketUpdateParams {
  refreshedTaskId: string | number;
  forceReload: boolean;
  isUpdateEvent: boolean;
}

const TaskList = () => {
  const [showTaskFilterModal, setShowTaskFilterModal] = useState(false); 

  const handleOpenFilterModal = () => {
      setShowTaskFilterModal(true); 
  };

  const handleCloseFilterModal = () => {
      setShowTaskFilterModal(false); 
  };
  const SocketIOCallback = useCallback(
    ({ refreshedTaskId, forceReload, isUpdateEvent }: SocketUpdateParams) => {
      console.log("SocketIOCallback called");
      console.log(refreshedTaskId, forceReload, isUpdateEvent);
      if (isUpdateEvent && refreshedTaskId) {
        // Update specific task
      } else if (forceReload) {
        // Reload all tasks
      }
    },
    [] // Pass the dependencies here so that on that dependency change, the task-filter fetching API can be called.
  );

  useEffect(() => {
    const handleConnection = (
      refreshedTaskId: string | number,
      forceReload: boolean,
      isUpdateEvent: boolean
    ) => {
      SocketIOCallback({ refreshedTaskId, forceReload, isUpdateEvent });
    };

    if (SocketIOService.isConnected()) {
      SocketIOService.disconnect();
    }

    SocketIOService.connect(handleConnection);

    return () => {
      SocketIOService.disconnect();
    };
  }, [SocketIOCallback]);

  return (
    <div>
        <h1>Hello World</h1>
        <CustomButton
            variant="secondary"
            size="md"
            label="Create Filter"
            onClick={handleOpenFilterModal}
            dataTestId="open-create-filter-modal"
            ariaLabel="Open Create Filter Modal"
        />
        <TaskFilterModal
            show={showTaskFilterModal} 
            onClose={handleCloseFilterModal} 
        />
    </div>
);
};
export default TaskList;
