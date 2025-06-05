import { TaskVariables } from "./task_filter_variables";

export interface FilterCriteria {
    includeAssignedTasks?: boolean;
    candidateGroup?: string;
    assignee?: string; 
    processVariables?: Array<{ 
      name: string;
      operator: string;
      value: string;
    }>;
    candidateGroupsExpression: string;
    sorting: Array<{
      sortBy: string;
      sortOrder: string;
    }>;
    createdAfter?: string;
    createdBefore?: string;
  }
  
  export interface FilterVariable {
    name: string;
    label: string;
  }
  

  
  export interface Filter {
    created?: string;
    modified?: string;
    id?: number;
    tenant?: string | null; 
    name: string; 
    criteria: FilterCriteria;
    variables?: TaskVariables[];
    isMyTasksEnabled ?: boolean;
    properties?: Record<string, any>;
    roles: string[];    
    users: string[];
    status?: string;
    createdBy?: string;
    modifiedBy?: string;
    parentFilterId?: string | null;
    editPermission?: boolean;
    filterType?: string;
    hide?: boolean;
    sortOrder?: number | string;
    unsaved?: boolean;
    description?: string;
    order?: number | string;
    resourceId?: string;
  }
  
  export interface FilterResponse {
    firstResult: number;
    maxResults: number;
    data: Filter[];
  }
 export interface UserDetail {
     sub?: string;
     email_verified?: boolean;
     roles?: string[];
     name?: string;
     groups?: string[];
     preferred_username: string;
     locale?: string;
     given_name?: string;
     family_name?: string;
     email?: string;
   }  
  
  export interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}