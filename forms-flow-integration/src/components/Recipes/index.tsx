
import React from "react";

const Recipes = React.memo((props : any) => {
  const {setTab} = props;


  React.useEffect(() => {
    setTab("Recipes"); 
  }, []);


  return (
    <>Recipes</>
  );
});

export default Recipes;
