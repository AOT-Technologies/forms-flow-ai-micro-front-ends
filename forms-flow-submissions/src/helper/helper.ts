 export const optionSortBy = {
  options:[
  { value: "created", label: "Submission Date" },
  { value: "form_name", label: "Form Name" },
  {value:"application_status", label:"Status"},
  {value:"id", label:"Submission Id"},
  {value:"created_by", label:"Submitter"},
],
  get keys(){
    return this.options.map(option => option.value);
  }, 
};

export const textTruncate = (wordLength, targetLength, text) => {
  return text?.length > wordLength
    ? text.substring(0, targetLength) + "..."
    : text;
};
export const replaceUrl = (URL, key, value) => {
  return URL.replace(key, value);
};
