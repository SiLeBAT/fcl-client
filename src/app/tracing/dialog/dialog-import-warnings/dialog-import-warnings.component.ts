import { Component, Inject } from "@angular/core";
import { MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from "@angular/material/legacy-dialog";

export interface DialogImportWarningsData {
    description: string | null;
    warnings: string[];
}

@Component({
    selector: "fcl-dialog-import-warnings",
    templateUrl: "./dialog-import-warnings.component.html",
    styleUrls: ["./dialog-import-warnings.component.scss"],
})
export class DialogImportWarningsComponent {
    description: string | null;
    warnings: string[];

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: DialogImportWarningsData,
    ) {
        this.description = data.description;
        this.warnings = data.warnings;
    }
}
