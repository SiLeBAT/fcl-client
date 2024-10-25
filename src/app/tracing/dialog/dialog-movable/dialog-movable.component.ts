import { Component, Inject } from "@angular/core";
import {
    MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
    MatLegacyDialogRef as MatDialogRef,
} from "@angular/material/legacy-dialog";
import { StationPropertiesData } from "../station-properties/station-properties.component";
import { DataImportWarningModalComponent } from "../data-import-warning-modal/data-import-warning-modal.component";

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
    styleUrls: ["./dialog-movable.component.scss"]
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
