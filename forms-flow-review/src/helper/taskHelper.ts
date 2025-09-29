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
//  Type mapping between Form.io and Camunda
 const sortableList = {
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
export const sortableKeysSet = new Set(Object.keys(sortableList));

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

// Adding sorting for these fields (not considered form variables)
  const enabledSort = new Set ([
    "applicationId",
    "submitterName",
    "formName"
  ])

  // Get the actual sortKey to use in API requests (for columns with same sortKey but different isFormVariable)
  const actualSortKey = filterListSortParams?.actualSortKey || filterListSortParams?.activeKey;
  
  // Build sort filter
  const newFilter = isFormVariable || enabledSort.has(actualSortKey)
    ? {
        sortBy: "processVariable",
        sortOrder: filterListSortParams?.[filterListSortParams?.activeKey]?.sortOrder,
        parameters: {
          variable: actualSortKey, 
          type:
          sortableList[
              filterListSortParams?.[filterListSortParams?.activeKey]?.type
            ] ||
            filterListSortParams?.[filterListSortParams?.activeKey]?.type ||
            null,
        },
      }
    : {
        sortBy: actualSortKey,
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
