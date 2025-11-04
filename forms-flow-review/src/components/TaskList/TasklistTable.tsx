import {
  RefreshIcon,
  ReusableTable,
  V8CustomButton,
} from "@formsflow/components";
import { HelperServices, StyleServices } from "@formsflow/service";
import { useEffect, useRef, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { batch, useDispatch, useSelector } from "react-redux";
import { isEqual, cloneDeep } from "lodash";
import {
  resetTaskListParams,
  setBPMTaskListActivePage,
  setBPMTaskLoader,
  setFilterListSortParams,
  setTaskListLimit,
} from "../../actions/taskActions";
import { MULTITENANCY_ENABLED } from "../../constants";
import { useHistory, useParams } from "react-router-dom";
import {
  fetchServiceTaskList,
} from "../../api/services/filterServices";
import TaskAssigneeManager from "../Assigne/Assigne";
import { buildDynamicColumns, optionSortBy } from "../../helper/tableHelper";
import { createReqPayload,sortableKeysSet } from "../../helper/taskHelper";
import { removeTenantKey } from "../../helper/helper";
import Loading from "../Loading/Loading";

interface Column {
  name: string;
  width: number;
  sortKey: string;
  resizable?: boolean;
  newWidth?: number;
  isFormVariable?: boolean;
  type?: string;
}

interface Task {
  id: string;
  name?: string;
  created?: string;
  assignee?: string;
  _embedded?: {
    variable?: Array<{ name: string; value: any }>;
    candidateGroups?: Array<{ groupId: string }>;
  };
}




const TaskListTable = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const history = useHistory();
  const {
    tasksCount,
    selectedFilter,
    tasksList,
    activePage,
    limit,
    dateRange,
    selectedAttributeFilter,
    filterListSortParams,
    isAssigned
  } = useSelector((state: any) => state.task);
  const { tenantId } = useParams();
  const tenantKey = useSelector((state: any) => state.tenants?.tenantId || state.tenants?.tenantData
?.key || tenantId);
  const isTaskListLoading = useSelector((state: any) => state.task.isTaskListLoading);

  const taskvariables = selectedFilter?.variables ?? [];

  const redirectUrl = useRef(
    MULTITENANCY_ENABLED ? `/tenant/${tenantKey}/` : "/"
  );
  const [columns, setColumns] = useState<Column[]>([]);
      const iconColor = StyleServices.getCSSVariable('--ff-gray-medium-dark');

  const getCellValue = (column: Column, task: Task) => {
    const { sortKey } = column;
    const { name: taskName, created, _embedded } = task ?? {};
    const variables = _embedded?.variable ?? [];
    const candidateGroups = _embedded?.candidateGroups ?? [];

    if (sortKey === "applicationId") {
      return variables.find((v) => v.name === "applicationId")?.value ?? "-";
    }

  //checking isFormVariable to avoid the inappropriate value setting when static and dynamic varibales are same
  if (!column.isFormVariable) {
    switch (sortKey) {
      case "name":
        return taskName ?? "-";
      case "created":
        return created ? HelperServices.getLocaldate(created) : "N/A";
      case "assignee":
        return <TaskAssigneeManager task={task} />;
      case "roles": {
  const validGroups = candidateGroups.filter(group => group?.groupId);

  const roleValues = validGroups.length > 0
    ? validGroups.map(group =>
        removeTenantKey(group.groupId, tenantKey, MULTITENANCY_ENABLED)
      )
    : ["-"];

  const allRoles = roleValues.join(",");

  return allRoles;
}



    }
  }

  const matchingVar = variables.find((v) => v.name === sortKey);
  if (!matchingVar) return "-";

    const dateTimeField = taskvariables.find(
      (v) => v.key === sortKey && v.type === "datetime"
    );
    const dateField = taskvariables.find(
      (v) => v.key === sortKey && v.type === "day"
    );
    const selectBoxes = taskvariables.find(
      (v) => v.key === sortKey && v.type === "selectboxes"
    );

    if (dateTimeField) {
      return matchingVar.value
        ? HelperServices.getLocalDateAndTime(matchingVar.value)
        : "-";
    }
    if (selectBoxes) {
      const obj = JSON.parse(matchingVar.value);
      const trueKeys = Object.keys(obj).filter((key) => obj[key]);
      return trueKeys.length ? trueKeys.join(", ") : "-";
    }
    if (dateField) {
      return matchingVar.value
        ? new Date(matchingVar.value)
            .toLocaleDateString("en-GB")
            .replace(/\//g, "-")
        : "-";
    }
    if (typeof matchingVar.value === "boolean") {
      return matchingVar.value ? "True" : "False";
    }
    return matchingVar.value ?? "-";
  };
  const handleRefresh = () => {
  dispatch(setBPMTaskLoader(true)); // optional: show loader on refresh

  // Create the payload same as your sort change handler
  const payload = createReqPayload(
    selectedFilter,
    selectedAttributeFilter,
    filterListSortParams,
    dateRange,
    isAssigned,
    false // or true if your filter needs it
  );

  dispatch(fetchServiceTaskList(payload, null, activePage, limit));
};


  // const handleColumnResize = (column: Column, newWidth: number) => {
  //   const updatedData = cloneDeep(selectedFilter);
  //   const variables = updatedData.variables.map((variable: any) =>
  //     variable.name === column.sortKey
  //       ? { ...variable, width: newWidth }
  //       : variable
  //   );
  //   dispatch(resetTaskListParams({ selectedFilter: { ...updatedData, variables } }));
  // };

  useEffect(() => {
    const dynamicColumns = buildDynamicColumns(taskvariables);
    setColumns((prev) => (!isEqual(prev, dynamicColumns) ? dynamicColumns : prev));
  }, [taskvariables]);

  const handleSortModelChange = (model: any) => {
    const column = columns.find((col) => col.sortKey === model?.[0]?.field);
    if (!column) return;
    dispatch(setBPMTaskLoader(true));

    const resetSortOrders = HelperServices.getResetSortOrders(optionSortBy.options);
    const enabledSort = new Set(["applicationId", "submitterName", "formName"]);
    const updatedFilterListSortParams = {
      ...resetSortOrders,
      [column.sortKey]: {
        sortOrder: model?.[0]?.sort,
        ...((column.isFormVariable || enabledSort.has(column.sortKey)) && {
          type: column.type,
        }),
      },
      activeKey: column.sortKey,
    };

    dispatch(setFilterListSortParams(updatedFilterListSortParams));
    const payload = createReqPayload(
      selectedFilter,
      selectedAttributeFilter,
      updatedFilterListSortParams,
      dateRange,
      isAssigned,
      column.isFormVariable
    );
    dispatch(fetchServiceTaskList(payload, null, activePage, limit));
  };

  const paginationModel = useMemo(
    () => ({ page: activePage - 1, pageSize: limit }),
    [activePage, limit]
  );

  const handlePaginationModelChange = ({ page, pageSize }: any) => {
    batch(() => {
      dispatch(setBPMTaskListActivePage(page + 1));
      dispatch(setTaskListLimit(pageSize));
    });
  };

  const muiColumns = useMemo(() => {
  // Filter out any existing "actions" column that might come from dynamic columns
  const filteredColumns = columns.filter(col => col.sortKey !== 'actions');

  return [
    ...filteredColumns.map((col, idx) => ({
      field: col.sortKey,
      headerName: t(col.name),
      flex: 1,
      sortable: true,
      minWidth: col.width,
      headerClassName: idx === filteredColumns.length - 1 ? 'no-right-separator' : '',
      renderCell: (params: any) => getCellValue(col, params.row),
    })),
    {
      field: "actions",
       renderHeader: () => (
        <V8CustomButton
          variant="secondary"
          icon={<RefreshIcon color={iconColor} />}
          iconOnly
          onClick={handleRefresh}
          dataTestId="task-refresh-button"
        />
      ),
      headerName: "",
      sortable: false,
      filterable: false,
      headerClassName: "sticky-column-header",
      cellClassName: "sticky-column-cell",

       width: 100,
      renderCell: (params: any) => (
        <V8CustomButton
          label={t("View")}
          dataTestId="task-view-button"
          variant="secondary"
          onClick={() => {
            history.push(`/task/${params.row.id}`);
          }}
        />
      ),
    },
  ];
}, [columns, t, taskvariables, history]);



  const memoizedRows = useMemo(() => tasksList || [], [tasksList]);

  if (!columns?.length) {
    return isTaskListLoading ? <Loading /> : (
      <div className="custom-table-wrapper-outter">
        <p className="empty-message" data-testid="empty-columns-message">
          {t("No tasks have been found. Try a different filter combination or contact your admin.")}
        </p>
      </div>
    );
  }

  return (
    <>
      <ReusableTable
        columns={muiColumns}
        disableColumnResize={false}
        rows={memoizedRows}
        rowCount={tasksCount}
        loading={isTaskListLoading}
        paginationMode="server"
        sortingMode="server"
        paginationModel={paginationModel}
        onPaginationModelChange={handlePaginationModelChange}
        sortModel={[
          filterListSortParams.activeKey
            ? {
                field: filterListSortParams.activeKey,
                sort: filterListSortParams[filterListSortParams.activeKey]?.sortOrder || "asc",
              }
            : {},
        ]}
        onSortModelChange={handleSortModelChange}
        noRowsLabel={t("No tasks found")}
        disableColumnMenu
        disableRowSelectionOnClick
        dataGridProps={{
          getRowId: (row: any) => row.id
        }}
        enableStickyActions={true}
      />
    </>
  );
};

export default TaskListTable;
