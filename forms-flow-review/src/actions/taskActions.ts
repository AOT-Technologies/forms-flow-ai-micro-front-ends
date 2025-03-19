import ACTION_CONSTANTS from "./actionConstants";

export const setTasks = (data: any) => ({
    type: ACTION_CONSTANTS.SET_TASKS,
    payload: data,
  })


