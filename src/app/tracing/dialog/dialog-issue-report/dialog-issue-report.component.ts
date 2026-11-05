import { Component, Inject } from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";

interface IssueGroup {
    label: string;
    issues: string[];
}

export type ReportIssues = string[] | IssueGroup[];

export interface DialogIssueReportData {
    title: string;
    description: string;
    issues: string[] | IssueGroup[];
}

function areIssuesUngrouped(issues: ReportIssues): issues is string[] {
    return issues.length > 0 && typeof issues[0] === "string";
}

@Component({
    selector: "fcl-dialog-issue-report",
    templateUrl: "./dialog-issue-report.component.html",
    styleUrls: ["./dialog-issue-report.component.scss"],
    standalone: false,
})
export class DialogIssueReportComponent {
    description: string | undefined;
    ungroupedIssues: string[];
    issueGroups: IssueGroup[];
    title: string;

    constructor(@Inject(MAT_DIALOG_DATA) public data: DialogIssueReportData) {
        this.description = data.description;
        this.ungroupedIssues = [];
        this.issueGroups = [];
        if (areIssuesUngrouped(data.issues)) {
            this.ungroupedIssues = data.issues;
        } else {
            this.issueGroups = data.issues;
        }
        this.title = data.title;
    }

    isSimpleString(value: any): boolean {
        return typeof value === "string";
    }
}
