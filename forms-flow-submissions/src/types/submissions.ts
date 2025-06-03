export type Submission = {
  applicationStatus: string;
  createdBy: string;
  data: any;
  formName: string;
  id: string;
  submissionId: string;
  created?: string;
};

export type SubmissionListResponse = {
  submissions: Submission[];
  totalCount: number;
  pageNo: number;
  limit: number;
};
