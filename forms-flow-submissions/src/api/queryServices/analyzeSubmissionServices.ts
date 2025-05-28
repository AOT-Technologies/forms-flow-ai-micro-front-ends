import API from "../endpoints";
import {  StorageService } from "@formsflow/service";
import axios from "axios";


type Submission = {
    applicationStatus: string;
    createdBy: string;
    data: any;
    formName: string;
    id: string;
    submissionId: string;
  };
  
  type SubmissionListResponse = {
    submissions: Submission[];
    totalCount: number;
    pageNo: number;
    limit: number;
  };
  
  export const getSubmissionList = (
    limit = 10,
    pageNo = 1,
    sortOrder = "asc",
    sortBy = "formName"
  ): Promise<SubmissionListResponse> => {
    const query = `
      query MyQuery {
        getSubmission(limit: ${limit}, pageNo: ${pageNo}, sortOrder: "${sortOrder}", sortBy: "${sortBy}") {
          submissions {
            applicationStatus
            createdBy
            data
            formName
            id
            submissionId
            created
          }
          totalCount
          pageNo     
          limit
        }
      }
    `;
  
    const payload = { query };
    const token = StorageService.get("AUTH_TOKEN");
  
    return axios
      .post(API.GRAPHQL_API, payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      })
      .then((response) => {
        const result = response.data?.data?.getSubmission;
        return result;
      });
  };
  