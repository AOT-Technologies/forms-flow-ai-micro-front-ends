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
