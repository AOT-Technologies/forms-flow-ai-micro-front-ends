import React from "react";

const Dashabord = React.memo((props : any) => {
  const {setTab} = props;

  React.useEffect(() => {
    setTab("Dashboard"); 
  }, []);


  return (
    <>dashboard</>
  );
});

export default Dashabord;
