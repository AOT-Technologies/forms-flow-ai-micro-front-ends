import ACTION_CONSTANTS from "../actions/actionConstants";

const initialState = {
    isTenantDetailLoading: false,
    tenantData: {},
};

const tenants = (state = initialState, action) => {
    if (action.type === ACTION_CONSTANTS.SET_TENANT_DATA) {
      localStorage.setItem("tenantData", JSON.stringify(action.payload));
      return {
        ...state,
        tenantData: action.payload,
        isTenantDataLoading: false,
      };
    }
    return state;
  };

export default tenants;
