import React, { useEffect } from "react";

const ConnectedApps = React.memo((props: any)=>{
    const { setTab } = props;
 useEffect(()=>{
    setTab("Connected Apps");
 },[])  
 return <> Connected Apps</> 
})

export default ConnectedApps;