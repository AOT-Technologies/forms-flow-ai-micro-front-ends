import { useEffect, useCallback } from "react";
import SocketIOService from "../services/SocketIOService";
import { fetchBPMTaskCount, fetchFilterList } from "../api/services/filterServices";
import { useDispatch, } from "react-redux";
import { setBPMFiltersAndCount } from "../actions/taskActions";
import { ResizableTable } from "../components";

interface SocketUpdateParams {
  refreshedTaskId: string | number;
  forceReload: boolean;
  isUpdateEvent: boolean;
}

const TaskList = () => {




  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchFilterList());
    dispatch(
      fetchFilterList((err, data) => {
        if (data) {
          fetchBPMTaskCount(data.filters)
            .then((res) => {
              dispatch(setBPMFiltersAndCount(res.data));
            })
            .catch((err) => {
              if (err) {
                console.error(err);
              }
            })
        }
      })
    );
  }, [dispatch]);




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
      <ResizableTable />
    </div>



  );
};



export default TaskList;
