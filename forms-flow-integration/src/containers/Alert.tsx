import React from "react";

const Alert = React.memo((props:any)=>{
    const {variant="primary", message} = props;
 return (
    <div className={`alert alert-${variant}`} role="alert">
   {message}
</div>
 )
});

export default Alert;