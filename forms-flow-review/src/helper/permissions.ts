import { StorageService } from "@formsflow/service";

export const userRolesData = JSON.parse(
    StorageService.get(StorageService.User.USER_ROLE) ?? "[]"
  );


  export const userRoles = () => {
    const role = (role) =>userRolesData.includes(role)
    return {
      viewTasks : role('view_tasks'), // can see task list and task details 
      manageMyTasks : role('manage_tasks'), //Can assign task to themselves and Can un claim task
      AssignTaskToOthers : role('assign_task_to_others'),//Can assign to others
      viewTaskHistory : role('reviewer_view_history'),//Can see task history button in task details
      viewFilters : role('view_filters'), //Can see task filter buttons and filter list
      createFilters : role('create_filters'), // Can create task filter and reorder task fllter addtionally than viewFilters
      manageAllFilters : role('manage_all_filters'), //Can manage all task filter excluding private filters
    }
  }


