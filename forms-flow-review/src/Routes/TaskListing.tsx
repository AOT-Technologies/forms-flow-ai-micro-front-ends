import { useEffect, useCallback } from "react";
import SocketIOService from "../services/SocketIOService";
import { ResizableTable } from "../components";

interface SocketUpdateParams {
  refreshedTaskId: string | number;
  forceReload: boolean;
  isUpdateEvent: boolean;
}

const TaskList = () => {
  const SocketIOCallback = useCallback(
    ({ refreshedTaskId, forceReload, isUpdateEvent }: SocketUpdateParams) => {
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
      <ResizableTable />
    </div>
  );
};

export default TaskList;
