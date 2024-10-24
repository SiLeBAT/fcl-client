import { Component, Inject } from "@angular/core";
import { MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from "@angular/material/legacy-dialog";

@Component({
    selector: "fcl-dialog-import-warnings",
    templateUrl: "./dialog-import-warnings.component.html",
    styleUrls: ["./dialog-import-warnings.component.scss"],
})
export class DialogImportWarningsComponent {
    constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}
}
