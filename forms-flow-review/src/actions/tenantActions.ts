import  ACTION_CONSTANTS from './actionConstants';

export const setTenantData = (tenantData) => (dispatch) => {
    dispatch({
      type: ACTION_CONSTANTS.SET_TENANT_DATA,
      payload: tenantData,
    });
  };
  