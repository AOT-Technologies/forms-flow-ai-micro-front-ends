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
    id?: number;
    tenant?: string | null;
    name: string;
    criteria: FilterCriteria;
    variables?: FilterVariable[];
    properties?: Record<string, any>;
    roles: string[];    
    users: string[];
    status?: string;
    taskVisibleAttributes?: TaskVisibleAttributes;
    parentFilterId?: string | null;
    editPermission?: boolean;
    filterType?: string;
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