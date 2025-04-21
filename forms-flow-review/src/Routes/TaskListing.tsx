import { useEffect, useCallback, useState } from "react";
import SocketIOService from "../services/SocketIOService";
import { CustomButton } from "@formsflow/components";
import TaskFilterModal from "../components/TaskFilterModal";
import AttributeFilterModal from "../components/AttributeFilterModal";
import { fetchBPMTaskCount, fetchFilterList, fetchServiceTaskList, updateDefaultFilter } from "../api/services/filterServices";
import { useDispatch, useSelector } from "react-redux";
import { setBPMFiltersAndCount, setBPMTaskListActivePage, setDefaultFilter, setSelectedBPMFilter, setSelectedTaskID } from "../actions/taskActions";
import { Dropdown, NavDropdown } from "react-bootstrap";



interface SocketUpdateParams {
  refreshedTaskId: string | number;
  forceReload: boolean;
  isUpdateEvent: boolean;
}

const TaskList = () => {
  
  const [showTaskFilterModal, setShowTaskFilterModal] = useState(false);
   

 
  const dispatch = useDispatch();
  const [showAttrFilterModal, setShowAttrFilterModal] = useState(false);
  // const [shareTaskFilter, setShareTaskFilter] = useState("PRIVATE_ONLY_YOU");
  const filterList = useSelector((state: any) => state.task.filtersAndCount);
  const filterListItems = useSelector((state: any) => state.task.filterList);
  const defaultFilter = useSelector((state: any) => state.task.defaultFilter);
  // const selectedFilter = useSelector((state: any) => state.task.selectedFilter);
  const reqData = useSelector((state: any) => state.task.listReqParams);
  const firstResult = useSelector((state: any) => state.task.firstResult);  
  const [taskAttributeData, setTaskAttributeData] = useState([]);
  const [shareFilter, setShareFilter] = useState("PRIVATE_ONLY_YOU");
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
          // .finally(() => {
          //   if (selectedFilterData) {
          //     if (selectedFilterData?.id === selectedFilter?.id) {
          //       dispatch(setSelectedBPMFilter(resData));
          //       fetchTasks(resData);
          //     }
          //     toast.success(t("Changes Applied Successfully"));
          //   } else {
          //     toast.success(t("Filter Created Successfully"));
          //   }
          //   dispatch(setBPMFilterLoader(false));
          // });
      }
    })
  );
}, [dispatch]);
useEffect(() => {
  //The search fields get clear when switching the filter
  setFilterParams({});
}, [selectedFilter]);

// Log filterList when it changes
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

  useEffect(() => {
    setFilterParams({});
  }, [shareFilter]);

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

  
    // if (filterList.length) {
    //   return (
    //     <>
    //       {filterList.map((filter, index) => {
    //         // const matchingFilterItem = filterListItems.find(
    //         //   (item) => item.id === filter.id
    //         // );
    //         // const editPermission =
    //         //   matchingFilterItem && matchingFilterItem.editPermission;
    //         return (
    //           <Dropdown.Item
    //             // as={Link}
    //             // to={`${redirectUrl}task`}
    //             className="custom-dropdown-menu"
    //             key={index}
    //           >
    //             <div className="d-flex align-items-center">
    //               <span
    //                 onClick={() => changeFilterSelection(filter)}
    //                 className="w-100"
    //               >
    //                 {filter?.name} {`(${filter.count || 0})`}
    //               </span>
    //               <button
    //                 onClick={() => {
    //                   // handleFilter(
    //                   //   filter?.id,
    //                   //   createFilters
    //                   // );
    //                 }}
    //                 className="btn btn-link"
    //               >
    //                 {/* <i
    //                   className={`me-1 fa fa-${
    //                     (createFilters || manageAllFilters) && editPermission
    //                       ? "pencil"
    //                       : viewFilters
    //                       ? `eye`
    //                       : ""
    //                   }`}
    //                 /> */}
    //                 {/* <Translation>
    //                   {(t) =>
    //                     t(
    //                       (createFilters || manageAllFilters) &&
    //                         editPermission
    //                         ? `Edit`
    //                         : viewFilters
    //                         ? `View`
    //                         : ""
    //                     )
    //                   }
    //                 </Translation> */}
    //               </button>
    //             </div>
    //           </Dropdown.Item>
    //         );
    //       })}
    //     </>
    //   );
    // }
  

 


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
          filterList.map((filter, index) => (
            <Dropdown.Item
              key={index}
              onClick={() => changeFilterSelection(filter)}
            >
              <div className="d-flex align-items-center">
                <span className="w-100">
                  {filter?.name} ({filter.count || 0})
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
