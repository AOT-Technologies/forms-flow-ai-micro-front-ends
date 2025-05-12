export interface FilterCriteria {
    candidateGroup?: string;
    assignee?: string;
    /*processVariables required for attribute filter only*/
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
  
  export interface TaskVisibleAttributes {
    applicationId: boolean;
    assignee: boolean;
    created: boolean;
    dueDate: boolean;
    followUp: boolean;
    priority: boolean;
  }
  
  export interface Filter {
    created?: string;
    modified?: string;
    id?: number;
    tenant?: string | null;
    description?: string;
    name: string;
    resourceId?: string;
    criteria: FilterCriteria;
    variables?: FilterVariable[];
    isMyTasksEnabled ?: boolean;
    properties?: Record<string, any>;
    roles: string[];    
    users: string[];
    status?: string;
    createdBy?: string;
    modifiedBy?: string;
    taskVisibleAttributes?: TaskVisibleAttributes;
    order?: string;
    parentFilterId?: string | null;
    editPermission?: boolean;
    filterType?: string;
    hide?: boolean;
    sortOrder?: string;
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