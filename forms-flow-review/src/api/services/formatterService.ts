export const taskDetailVariableDataFormatter = (taskVariableData) => {
    const res = {};
    for (let variable in taskVariableData) {
      res[variable] = taskVariableData[variable].value;
    }
    return res;
  };