import { useDispatch } from "react-redux";
import type { ThunkDispatch, AnyAction } from "@reduxjs/toolkit";
import type { RootState } from "./reducers";

export type AppDispatch = ThunkDispatch<RootState, unknown, AnyAction>;
export const useAppDispatch = (): AppDispatch => useDispatch<AppDispatch>();
