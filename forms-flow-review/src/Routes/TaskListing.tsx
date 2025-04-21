import { useEffect, useCallback, useState } from "react";
import SocketIOService from "../services/SocketIOService";
import { CustomButton } from "@formsflow/components";
import TaskFilterModal from "../components/TaskFilterModal";
import AttributeFilterModal from "../components/AttributeFilterModal";
import { fetchBPMTaskCount, fetchFilterList, updateDefaultFilter } from "../api/services/filterServices";
import { useDispatch, useSelector } from "react-redux";
import { setBPMFiltersAndCount, setBPMTaskListActivePage, setDefaultFilter, setSelectedTaskID } from "../actions/taskActions";
import { Dropdown } from "react-bootstrap";


import { ResizableTable } from "../components";

interface SocketUpdateParams {
  refreshedTaskId: string | number;
  forceReload: boolean;
  isUpdateEvent: boolean;
}

const TaskList = () => {
  
  const [showTaskFilterModal, setShowTaskFilterModal] = useState(false);
   

 
  const dispatch = useDispatch();
  const [showAttrFilterModal, setShowAttrFilterModal] = useState(false);
  const filterList = useSelector((state: any) => state.task.filtersAndCount);
  const filterListItems = useSelector((state: any) => state.task.filterList);
  const defaultFilter = useSelector((state: any) => state.task.defaultFilter);
  const [taskAttributeData, setTaskAttributeData] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [filterParams, setFilterParams] = useState({});



  const handleToggleFilterModal = () => {
    setShowTaskFilterModal(prevState => !prevState);
};
 
  const handleToggleAttrFilterModal = () => {
    setShowAttrFilterModal(prevState => !prevState);
};
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


useEffect(() => {
  console.log("Filter List Updated:", filterListItems);
  console.log("Filter count:", filterList.length);
}, [filterListItems, filterList]);
 
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

 

    const changeFilterSelection = (filter) => {
      const selectedFilter = filterListItems.find(
        (item) => item.id === filter.id
      );
      const taskAttributes = selectedFilter.variables.filter(variable => variable.isChecked === true);
      setTaskAttributeData(taskAttributes);
      setSelectedFilter(selectedFilter);
      const isDefaultFilter = selectedFilter.id === defaultFilter ? null : selectedFilter.id;
                updateDefaultFilter(isDefaultFilter)
                    .then(updateRes => dispatch(setDefaultFilter(updateRes.data.defaultFilter)))
                    .catch(error => console.error("Error updating default filter:", error));  
      dispatch(setSelectedTaskID(null));
      dispatch(setBPMTaskListActivePage(1));
    };

  

  return (
    <div>
        <h1>Hello World</h1>
        
        <CustomButton
            variant="secondary"
            size="md"
            label="Create Filter"
            onClick={handleToggleFilterModal}
            dataTestId="open-create-filter-modal"
            ariaLabel="Toggle Create Filter Modal"
        />
        <TaskFilterModal
            show={showTaskFilterModal}
            onClose={handleToggleFilterModal}
        />
    
        
        <CustomButton
            variant="secondary"
            size="md"
            label="Attribute Filter"
            onClick={handleToggleAttrFilterModal}
            dataTestId="open-create-filter-modal"
            ariaLabel="Open Create Filter Modal"
        />
        
        <AttributeFilterModal
            show={showAttrFilterModal}
            onClose={handleToggleAttrFilterModal}
            taskAttributeData={taskAttributeData}
            filterParams={filterParams}
            setFilterParams={setFilterParams}
            selectedFilter={selectedFilter}
        />
         <Dropdown>
      <Dropdown.Toggle variant="secondary" id="dropdown-basic">
        Select Filter
      </Dropdown.Toggle>
    
      <Dropdown.Menu className="custom-dropdown-menu">
          {filterList.length ? (
            filterList.map((filter) => (
              <Dropdown.Item
                key={filter.name}
                onClick={() => changeFilterSelection(filter)}
              >
                <div className="d-flex align-items-center">
                  <span className="w-100">
                    {filter?.name} ({filter.count ?? 0})
                  </span>
                </div>
              </Dropdown.Item>
            ))
          ) : (
          <Dropdown.Item disabled>No Filters Found</Dropdown.Item>
        )}
      </Dropdown.Menu>
    </Dropdown>
    </div>
  
  );
};
     
        

export default TaskList;
