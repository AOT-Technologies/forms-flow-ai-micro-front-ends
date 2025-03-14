export interface FormData {
  [key: string]: string | number | boolean | object;
}

export interface RequestCreateFormat {
  formId: string | number;
  submissionId: string | number;
  formUrl: string;
  webFormUrl: string;
  data: FormData;
}

export interface FormioCreateResponse {
  data?: {
    form: string;
    _id: string;
    data: FormData;
  };
}
