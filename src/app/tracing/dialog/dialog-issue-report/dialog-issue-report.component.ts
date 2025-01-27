import { Component, Inject } from "@angular/core";
import { MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from "@angular/material/legacy-dialog";

export type ReportIssues = string[] | { label: string; issues: string[] }[];

export interface DialogIssueReportData {
    title: string;
    description: string;
    issues: string[] | { label: string; issues: string[] }[];
}

@Component({
    selector: "fcl-dialog-issue-report",
    templateUrl: "./dialog-issue-report.component.html",
    styleUrls: ["./dialog-issue-report.component.scss"],
})
export class DialogIssueReportComponent {
    description: string | undefined;
    issues: ReportIssues = [];
    title: string;

    constructor(@Inject(MAT_DIALOG_DATA) public data: DialogIssueReportData) {
        this.description = data.description;
        this.issues = data.issues;
        this.title = data.title;
    }

    get useSimpleStringList(): boolean {
        return this.issues.length === 0 || typeof this.issues[0] === "string";
    }

    isSimpleString(value: any): boolean {
        return typeof value === "string";
    }
}
