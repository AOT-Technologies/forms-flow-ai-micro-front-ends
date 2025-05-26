import { HelperServices } from "@formsflow/service";

export const buildDynamicColumns = (taskvariables) => {
  return taskvariables
    .reduce((acc, variable) => {
      if (variable.isChecked) {
        acc.push({
          name: variable.label,
          width: variable.width ?? 200,
          sortKey: variable.name,
          resizable: true,
          sortOrder: variable.sortOrder
        });
      }
      return acc;
    }, [])
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(({ sortOrder, ...column }) => column) // Remove sortOrder from final result
    .reduce((finalColumns, column, index, array) => {
      finalColumns.push(column);
      
      // Add actions column after the last item
      if (index === array.length - 1 && array.length > 0) {
        finalColumns.push({
          name: "",
          width: 100,
          sortKey: "actions",
          resizable: false,
        });
      }
      
      return finalColumns;
    }, []);
};



export const buildDateRangePayload = (dateRange) => {
  const date = { createdAfter: null, createdBefore: null };
  if (dateRange?.startDate && dateRange?.endDate) {
    date.createdAfter = HelperServices.getISODateTime(dateRange.startDate);
    date.createdBefore = HelperServices.getISODateTime(dateRange.endDate);
  }
  return date.createdAfter ? date : {};
};

 

 export const optionSortBy = {
  options:[
  { value: "name", label: "Task" },
  { value: "created", label: "Created Date" },
  { value: "assignee", label: "Assigned To" },
],
  get keys(){
    return this.options.map(option => option.value);
  }, 
};

