export const formatDate = (isoString: string): string => {
  if (!isoString) return "";

  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "";

  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  };

  return date.toLocaleString("en-US", options);
};


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
