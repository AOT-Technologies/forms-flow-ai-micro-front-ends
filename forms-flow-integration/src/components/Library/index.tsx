import React,{useEffect} from "react";

const Library = React.memo((props : any) => {
 const {setTab} = props;
 useEffect(()=>{
    setTab("Library")
 },[])
 return <>Library</>
});

export default Library;