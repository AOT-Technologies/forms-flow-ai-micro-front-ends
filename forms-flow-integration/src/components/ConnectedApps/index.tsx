
import React, { useState } from "react";
import { fetchConnectedApps } from "../../services/connectedApps";
import Loading from "../Loading";
import Alert from "../../containers/Alert";

const ConnectedApps = React.memo((props: any) => {
   const { setTab } = props;
   const [connectedAppsLoading, setConnectedAppsLoading] = useState(false);
   const [connectedApps, setConnectedApps] = useState('');
   const [error, setError] = useState('');


   React.useEffect(() => {
      setTab("Connected Apps");
      setConnectedAppsLoading(true);
      fetchConnectedApps().then((res: any) => {
         setConnectedApps(res.data?.url);
      }).catch((err: any) => {
         const error = err.response?.data?.type || err.message;
         setError(error);
      }).finally(() => setConnectedAppsLoading(false))
   }, []);

   if (connectedAppsLoading) {
      return <Loading />
   }
   if (error) {
      <Alert variant="danger" message={error} />
   }

   return (
      <>
         {connectedApps ? <iframe width="100%"
            height="500"
            src={connectedApps}
            title="connected apps" >
         </iframe> : <Alert message="No urls found"/> }
      </>
   );
});

export default ConnectedApps;
