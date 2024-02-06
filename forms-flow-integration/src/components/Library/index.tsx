
import React, { useState } from "react";
import { fetchLibrary } from "../../services/library";
import Loading from "../Loading";
import Alert from "../../containers/Alert";

const Library = React.memo((props: any) => {
   const { setTab } = props;
   const [libraryLoading, setLibraryLoading] = useState(false);
   const [libraryUrl, setLibraryUrl] = useState('');
   const [error, setError] = useState('');


   React.useEffect(() => {
      setTab("Library");
      setLibraryLoading(true);
      fetchLibrary().then((res: any) => {
         setLibraryUrl(res.data?.url);
      }).catch((err: any) => {
         const error = err.response?.data?.type || err.message;
         setError(error);
      }).finally(() => setLibraryLoading(false))
   }, []);

   if (libraryLoading) {
      return <Loading />
   }

   if (error) {
      <Alert variant="danger" message={error} />
   }

   return (
      <> {libraryUrl ? <iframe width="100%"
         height="500"
         src={libraryUrl}
         title="Library" >
      </iframe> : <Alert message="No urls found"/> }</>
   );
});

export default Library;
