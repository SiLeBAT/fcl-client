import { Action } from "@ngrx/store";

export enum VisioActionTypes {
    GenerateROAReportMSA = "[Visio] Generate ROA Report",
    OpenROAReportConfigurationMSA = "[Visio] Open ROA Report Configuration",
}

export class GenerateROAReportMSA implements Action {
    readonly type = VisioActionTypes.GenerateROAReportMSA;
}

export class OpenROAReportConfigurationMSA implements Action {
    readonly type = VisioActionTypes.OpenROAReportConfigurationMSA;
}

export type VisioActions = GenerateROAReportMSA | OpenROAReportConfigurationMSA;
