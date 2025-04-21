import ACTION_CONSTANTS from "../actions/actionConstants";

const initialState = {
  error: "",
  tasks: [{
    submissionId: "1232123",
    task: "Verify Permit Application",
    createdDate: "27-06-2024",
    assignedTo: "John Doe",
    submitterName: "Justin King",
  },
  {
    submissionId: "1232123",
    task: "Approve Leave Request",
    createdDate: "27-06-2024",
    assignedTo: "Me / Others",
    submitterName: "Kimberly Baker",
  },
  {
    submissionId: "1232123",
    task: "Submit Expense Report",
    createdDate: "27-06-2024",
    assignedTo: "Max Sergeyenko",
    submitterName: "Samantha Reed",
  },
  {
    submissionId: "1232123",
    task: "Review Document Submission",
    createdDate: "27-06-2024",
    assignedTo: "John Doe",
    submitterName: "Heather Edwards",
  },
  {
    submissionId: "1232123",
    task: "Complete Data Entry",
    createdDate: "27-06-2024",
    assignedTo: "Michael Kares",
    submitterName: "Justin King",
  },
  {
    submissionId: "1232123",
    task: "Confirm Customer Request",
    createdDate: "27-06-2024",
    assignedTo: "Sarah Johnson",
    submitterName: "Samantha Reed",
  },
  {
    submissionId: "1232123",
    task: "Upload Supporting Documents",
    createdDate: "27-06-2024",
    assignedTo: "Robert Martinez",
    submitterName: "Kimberly Baker",
  },
  {
    submissionId: "1232123",
    task: "Validate User Credentials",
    createdDate: "27-06-2024",
    assignedTo: "David Wilson",
    submitterName: "Heather Edwards",
  },
  {
    submissionId: "1232123",
    task: "Authorize Payment Processing",
    createdDate: "27-06-2024",
    assignedTo: "Laura Thompson",
    submitterName: "Justin King",
  },
  {
    submissionId: "1232123",
    task: "Send Approval Notification",
    createdDate: "27-06-2024",
    assignedTo: "Christopher Lewis",
    submitterName: "Samantha Reed",
  },
  {
    submissionId: "1232123",
    task: "Process New Hire Onboarding",
    createdDate: "27-06-2024",
    assignedTo: "Jennifer Adams",
    submitterName: "Jacob Price",
  },
  {
    submissionId: "1232123",
    task: "Approve Job Offer",
    createdDate: "27-06-2024",
    assignedTo: "Thomas Carter",
    submitterName: "Heather Edwards",
  },
  {
    submissionId: "1232123",
    task: "Review Employee Timesheet",
    createdDate: "27-06-2024",
    assignedTo: "Thomas Carter",
    submitterName: "Justin King",
  },
  {
    submissionId: "1232123",
    task: "Update Payroll Records",
    createdDate: "27-06-2024",
    assignedTo: "Robert Martinez",
    submitterName: "Jacob Price",
  },
  {
    submissionId: "1232123",
    task: "Assign Employee Training",
    createdDate: "27-06-2024",
    assignedTo: "Max Sergeyenko",
    submitterName: "Kimberly Baker",
  },
],
  limit: 5,
  taskListPage: 1,
  totalTasks: 0,
  sortBy: "submissionId",
  sortOrder: "asc",
  sort: {
    activeKey: "submissionId",
    submissionId: { sortOrder: "asc" },
    task: { sortOrder: "asc" },
    createdDate: { sortOrder: "asc" },
    assignedTo: { sortOrder: "asc" },
    submitterName: { sortOrder: "asc" },
  }
};

const TaskList = (state = initialState, action) => {
  switch (action.type) {
    case ACTION_CONSTANTS.TASKLIST:
      return {
        ...state,
        tasks: (action.payload.forms),
        totalTasks: action.payload.totalCount,
      };
    case ACTION_CONSTANTS.TASK_LIST_LIMIT_CHANGE:
      return { ...state, limit: action.payload };
    case ACTION_CONSTANTS.TASK_LIST_PAGE_CHANGE:
      return { ...state, formListPage: action.payload };;
    case ACTION_CONSTANTS.TASK_LIST_SORT_CHANGE:
      return { ...state, sortOrder: action.payload };
    case ACTION_CONSTANTS.TASK_SORT:
      return { ...state, sort: action.payload };
    default:
      return state;
  }
};
export default TaskList;
