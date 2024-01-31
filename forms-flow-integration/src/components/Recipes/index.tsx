
import React, { useState } from "react";
import { fetchRecipesUrls } from "../../services/recipes";
import Loading from "../Loading";
import Alert from "../../containers/Alert";

const Recipes = React.memo((props: any) => {
  const { setTab } = props;
  const [recipesLoading, setRecipesLoading] = useState(false);
  const [recipesUrl, setRecipesUrl] = useState('');
  const [error, setError] = useState('');


  React.useEffect(() => {
    setTab("Recipes");
    setError('');
    setRecipesLoading(true);
    fetchRecipesUrls().then((res: any) => {
      setRecipesUrl(res.data?.url);
    }).catch((err: any) => {
      const error = err.response?.data?.type || err.message;
      setError(error);
    }).finally(() => setRecipesLoading(false))
  }, []);

  if (recipesLoading) {
    return <Loading />
  }

  if (error) {
    <Alert variant="danger" message={error} />
  }


  return (
    <> {recipesUrl ? <iframe width="100%"
      height="500"
      src={recipesUrl}
      title="Recipes" >
    </iframe> : <Alert message="No urls found"/> }</>
  );
});

export default Recipes;
