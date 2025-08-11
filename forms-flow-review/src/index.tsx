import React, {useCallback, useEffect, useMemo, useState } from "react";
import { Route, Switch, Redirect, useParams,useHistory } from "react-router-dom";
import { KeycloakService, StorageService } from "@formsflow/service";
import {
  KEYCLOAK_URL_AUTH,
  KEYCLOAK_URL_REALM,
  KEYCLOAK_CLIENT,
} from "./api/config";
import { BASE_ROUTE, MULTITENANCY_ENABLED } from "./constants";
import i18n from "./config/i18n";
import "./index.scss";
import Loading from "./components/Loading";
import TaskList from "./Routes/TaskListing";
import TaskDetails from "./Routes/TaskDetails";
import SocketIOService from "./services/SocketIOService";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "./reducers";
import { getOnlyTaskDetails } from "./api/services/bpmTaskServices";
import { setBPMTaskDetail,setTaskAssignee } from "./actions/taskActions"; 
import { StyleServices } from "@formsflow/service";

import { fetchServiceTaskList, fetchUserList } from "./api/services/filterServices";
const authorizedRoles = new Set([
  "view_tasks",
  "manage_all_filters",
  "manage_tasks",
  "view_filters",
  "create_filters",
]);

interface SocketUpdateParams {
  refreshedTaskId: string;
  forceReload: boolean;
  isUpdateEvent: boolean;
}
const Task = React.memo((props: any) => {
  const { publish, subscribe } = props;
  const { tenantId } = useParams();
    const history = useHistory();
  const dispatch = useDispatch();
  const instance = useMemo(() => props.getKcInstance(), []);
  const [isAuth, setIsAuth] = useState(instance?.isAuthenticated());
  const [isReviewer, setIsReviewer] = useState(false);
  const baseUrl = MULTITENANCY_ENABLED ? `/tenant/${tenantId}/` : "/";
  const {
    taskId,
    taskDetails,
    // taskIds, // this variable is a set of taskIds which already in the table
    lastRequestedPayload,
    activePage,
    limit,
    userList,
  } = useSelector((state: RootState) => state.task);

  useEffect(() => {
    publish("ES_ROUTE", { pathname: `${baseUrl}task` });
    subscribe("ES_CHANGE_LANGUAGE", (msg, data) => {
      i18n.changeLanguage(data);
    });
  }, []);

  useEffect(() => {
    StorageService.save("tenantKey", tenantId ?? "");
  }, [tenantId]);

  useEffect(() => {
    if (!isAuth) {
      let instance = KeycloakService.getInstance(
        KEYCLOAK_URL_AUTH,
        KEYCLOAK_URL_REALM,
        KEYCLOAK_CLIENT,
        tenantId
      );
      instance.initKeycloak(() => {
        setIsAuth(instance.isAuthenticated());
        publish("FF_AUTH", instance);
      });
    }
  }, []);
  useEffect(() => {
    if (!isAuth) return;
    const roles = JSON.parse(StorageService.get(StorageService.User.USER_ROLE));
    if (roles.some((role: any) => authorizedRoles.has(role))) {
      setIsReviewer(true);
    }
    const locale = localStorage.getItem("i18nextLng");
    if (locale) i18n.changeLanguage(locale);
    publish("ES_ROUTE", { pathname: `${baseUrl}task` });
    subscribe("ES_CHANGE_LANGUAGE", (msg, data) => {
      i18n.changeLanguage(data);
    });
    
    // Fetch userList if not already present in the state
    if (!userList?.data || userList.data.length === 0) {
      dispatch(fetchUserList());
    }
  }, [isAuth]);

  const getTasks = ()=>{
     dispatch(
        fetchServiceTaskList(lastRequestedPayload, null, activePage, limit)
     );
  };
  /* ------------------------ handling socket callback function ------------------------ */
  const checkTheTaskIdExistThenRefetchTaskList = () => {
    // if the id exist or taskList empty we need to recall
    // const isExist = taskIds.has(taskId)
    // if (isExist || !taskIds.size) {
    //   dispatch(
    //     fetchServiceTaskList(lastRequestedPayload, null, activePage, limit)
    //   );
    // }
    // NOTE: currently we just commented the code and use below code to all users fetch tasklist again if any event trigger in this socket
    getTasks();
  };

  const handleTaskUpdate = (refreshedTaskId: string) => {
    console.log("handleTaskUpdate test",refreshedTaskId,taskId);
    // taskId & refreshedTaskId will be equal if user is in task details page
  if (taskId === refreshedTaskId) {
    // if a task opened, some changes made against this task we need to recall the details
    getOnlyTaskDetails(refreshedTaskId).then((response) => {
      dispatch(
        setBPMTaskDetail({
          ...response.data,
          variables: taskDetails?.variables,
        })
      );
      console.log("handleTaskUpdate inside",response.data.assignee);
      // Added to update assignee when socket trigger happens when user is in task details page 
      dispatch(setTaskAssignee(response.data.assignee))
    });
  }
  checkTheTaskIdExistThenRefetchTaskList();
};

const handleForceReload = (refreshedTaskId: string) => {
  //  if opened task is there we need to push back to task route
  //  if it push back to task route it will automatically call the tasklist api again
  // else we need to fetch again task list
  if(taskId == refreshedTaskId){
   history.push(`${baseUrl}task`)
  }else{
    checkTheTaskIdExistThenRefetchTaskList();
  }
};

const SocketIOCallback = useCallback(({
    refreshedTaskId,
    forceReload,
    isUpdateEvent,
  }: SocketUpdateParams) => {
    if (!refreshedTaskId) return;
    /**
       * use of this socket call back , need to update task realtime and 
       * also tasklist if the task id is exist inthe tasklist
       */
      console.log("SocketIOCallback test",isUpdateEvent,refreshedTaskId);
    if (isUpdateEvent) { 
      handleTaskUpdate(refreshedTaskId);
    } else if (forceReload) {
      handleForceReload(refreshedTaskId);
    }else{
      // here we just need to refetch the task list
      // this is used when task is created or deleted
      getTasks();
    }
  },[taskId, taskDetails, lastRequestedPayload, activePage, limit]);

 

  useEffect(() => {
    const handleConnection = (
      refreshedTaskId: string,
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

  if (!isAuth) {
    return <Loading />;
  }
  if (!isReviewer) return <p>unauthorized</p>;

  const customLogoPath =  StyleServices?.getCSSVariable("--custom-logo-path");
  const customTitle = StyleServices?.getCSSVariable("--custom-title");
  const hasMultitenancyHeader = customLogoPath || customTitle;

  return (
    <>
      <div className={`${hasMultitenancyHeader ? 'main-container-with-custom-header ' : 'main-container' } `}>
        <div className="page-content">
            <Switch>
              <Route
                exact
                path={`${BASE_ROUTE}task`}
                render={() => <TaskList {...props} />}
              />
              <Route
                exact
                path={`${BASE_ROUTE}task/:taskId`}
                render={() => <TaskDetails {...props} />}
              />
              <Redirect from="*" to="/404" />
            </Switch>
        </div>
      </div>
    </>
  );
});

export default Task;