const setUserRolesToObject = (response)=>{
    let roleObject = {};
    response.forEach(role => {
      roleObject[role.type] = role.roleId;
    });
    return roleObject;
  };

  export { setUserRolesToObject };
  