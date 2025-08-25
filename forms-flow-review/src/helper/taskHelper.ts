import { buildDateRangePayload } from "./tableHelper";
import { cloneDeep } from "lodash";

/**
 * 
 * @param selectedFilter - current selected filter
 * @param selectedAttributeFilter - current selected attribute filter
 * @param filterListSortParams - sorting params for filter list
 * @param dateRange  - date range for filtering tasks
 * @param isAssigned  - boolean to check if tasks are assigned to current user
 * @returns 
 */
export const createReqPayload = (
  selectedFilter,
  selectedAttributeFilter,
  filterListSortParams,
  dateRange,
  isAssigned,
  isFormVariable=false
) => {
  const clonedFilter = cloneDeep(selectedFilter); 
  const {
    processVariables: attributeProcessVariable,
    assignee: attributeAssignee,
  } = selectedAttributeFilter?.criteria || {};
  const processVariables = {
    processVariables:
      attributeProcessVariable || clonedFilter?.criteria?.processVariables,
  };
  const assignee = {
    assignee: attributeAssignee || clonedFilter?.criteria?.assignee,
  };
  // here we are taking the sorting from filterListsortparams instead of taking of inside the selectedFilter

    //  Type mapping between Form.io and Camunda
  const typeMapping = {
    phoneNumber: "String",
    checkbox: "Boolean",
    currency: "Integer",
    radio: "String",
    datetime: "String",
    select: "String",
    selectboxes:"String",
    time:"String",
    url:"String",
    day:"String",
    textfield:"String",
    number:"Integer",
    textarea:"String",
    address:"String",
    email:"String",
    tags:"String"
  }; 

// Adding sorting for these fields (not considered form variables)
  const enabledSort = new Set ([
    "applicationId",
    "submitterName",
    "formName"
  ])

  // Build sort filter
  const newFilter = isFormVariable || enabledSort.has(filterListSortParams?.activeKey)
    ? {
        sortBy: "processVariable",
        sortOrder: filterListSortParams?.[filterListSortParams?.activeKey]?.sortOrder,
        parameters: {
          variable: filterListSortParams?.activeKey, 
          type:
            typeMapping[
              filterListSortParams?.[filterListSortParams?.activeKey]?.type
            ] ||
            filterListSortParams?.[filterListSortParams?.activeKey]?.type ||
            null,
        },
      }
    : {
        sortBy: filterListSortParams?.activeKey,
        sortOrder:
          filterListSortParams?.[filterListSortParams?.activeKey]?.sortOrder,
      };

  const date = buildDateRangePayload(dateRange);
  const updatedFilter = {
    ...clonedFilter,
    criteria: {
      ...clonedFilter?.criteria,
      ...(processVariables.processVariables?.length && processVariables),
      ...(assignee.assignee && assignee),
      ...date,
      sorting: [newFilter],
      ...(isAssigned && { assigneeExpression: "${ currentUser() }" }),
    },
  };
  return updatedFilter;
};
