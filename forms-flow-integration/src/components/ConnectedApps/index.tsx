
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
      <Alert variant="danger" message={error} dataTestId="integration-connected-apps-error-alert" />
   }

   return (
      <>
         {connectedApps ? <iframe width="100%"
            height="700"
            src={connectedApps}
            title="connected apps"
            data-testid="integration-connected-apps-iframe" >
         </iframe> : <Alert message="No urls found" dataTestId="integration-connected-apps-no-url-alert"/> }
      </>
   );
});

export default ConnectedApps;
