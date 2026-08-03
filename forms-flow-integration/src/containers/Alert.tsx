import React from "react";

const Alert = React.memo((props:any)=>{
    const {variant="primary", message, dataTestId} = props;
 return (
    <div className={`alert alert-${variant}`} role="alert" data-testid={dataTestId}>
   {message}
</div>
 )
});

export default Alert;