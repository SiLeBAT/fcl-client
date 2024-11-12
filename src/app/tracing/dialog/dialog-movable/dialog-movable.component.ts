import { Component, Inject } from "@angular/core";
import {
    MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
    MatLegacyDialogRef as MatDialogRef,
} from "@angular/material/legacy-dialog";

export enum DialogMovableTemplate {
    fclStationProperties = "fclStationProperties",
    dataImportWarning = "dataImportWarning",
}

interface DialogMovableData {
    data: any;
}

@Component({
    selector: "fcl-dialog-movable",
    templateUrl: "./dialog-movable.component.html",
})
export class DialogMovableComponent {
    dialogData: any;
    constructor(
        public dialogRef: MatDialogRef<DialogMovableComponent>,
        @Inject(MAT_DIALOG_DATA) public data: DialogMovableData,
    ) {
        this.dialogData = data;
    }
}
