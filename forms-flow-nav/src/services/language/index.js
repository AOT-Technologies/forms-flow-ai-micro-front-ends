import { RequestService, StorageService } from "@formsflow/service";
import API from "../../endpoints/index";

export const fetchSelectLanguages = (callback) => {
  return fetch(`/languageConfig/languageData.json`, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  })
    .then((res) => {
      return res.json();
    })
    .then((data) => callback(data));
};

export const updateUserlang = (data, instance) => {
  const apiUpdatelang = API.LANG_UPDATE;
  RequestService.httpPUTRequest(
    apiUpdatelang,
    { locale: data },
    StorageService.get(StorageService.User.AUTH_TOKEN)
  )
    .then((res) => {
      if (res.data) {
        localStorage.setItem("lang", data);
        instance.initKeycloak();
      } else {
        //toast.error(<Translation>{(t)=>t("Failed")}</Translation>);
      }
    })
    .catch((error) => {
      console.log(error);
      // toast.error(<Translation>{(t) => t("Failed")}</Translation>);
    });
};
