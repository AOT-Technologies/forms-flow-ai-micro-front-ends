import { TaskVariables } from "../types/task_filter_variables";

export const defaultTaskVariable: TaskVariables[] =  [
  { key: 'applicationId', label: 'Submission Id', type: 'number', name: 'applicationId', isChecked: true, sortOrder: 1, isFormVariable: false },
  { key: 'submitterName', label: 'Submitter Name', type: 'textfield', name: 'submitterName', isChecked: true, sortOrder: 2, isFormVariable: false },
  { key: 'assignee', label: 'Assignee', type: 'textfield', name: 'assignee', isChecked: true, sortOrder: 3, isFormVariable: false },
  { key: 'roles', label: 'Roles', type: 'textfield', name: 'roles', isChecked: true, sortOrder:4, isFormVariable: false },
  { key: 'name', label: 'Task', type: 'textfield', name: 'name', isChecked: true, sortOrder: 5, isFormVariable: false },
  { key: 'created', label: 'Created Date', type: 'datetime', name: 'created', isChecked: true, sortOrder: 6, isFormVariable: false },
  { key: 'formName', label: 'Form Name', type: 'textfield', name: 'formName', isChecked: true, sortOrder: 7, isFormVariable: false },
  
] 

