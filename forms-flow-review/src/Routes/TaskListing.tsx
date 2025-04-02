import { useEffect, useCallback ,useState} from "react";
import SocketIOService from "../services/SocketIOService";
import { FormSelectionModal } from "../components/FormSelectionModal";
interface SocketUpdateParams {
  refreshedTaskId: string | number;
  forceReload: boolean;
  isUpdateEvent: boolean;
}

const TaskList = () => {
  const [showFormSelectionModal, setShowFormSelectionModal] = useState(false);
  const handleFormSelection = () => {
    setShowFormSelectionModal(false);
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

  return( <div>
    <h1> Hello world</h1>
    <button 
        type="button"
        onClick={()=>setShowFormSelectionModal(true)}
        >
          Form selection modAL
        </button>
    <FormSelectionModal 
    showModal={showFormSelectionModal}
    onClose={()=>handleFormSelection}
     />
    </div>)
};
export default TaskList;
