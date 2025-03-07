import ACTION_CONSTANTS from "../actions/actionConstants";

const initialState = {
   tasks:[]
};

interface TaskAction {
    type: string,
    payload: any
}

const TaskHandler = (state = initialState, action:TaskAction) => {
  switch (action.type) {
    case ACTION_CONSTANTS.SET_TASKS:
      return { ...state, tasks: action.payload };
    default:
      return state;
  }
};

export default TaskHandler;