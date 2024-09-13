import { Component, Inject } from "@angular/core";
import {
    MatLegacyDialogRef as MatDialogRef,
    MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
} from "@angular/material/legacy-dialog";
import { Constants } from "../../util/constants";

export interface DialogOkCancelData {
    title: string;
    content1: string;
    content2?: string;
    cancel: string;
    ok: string;
}

@Component({
    selector: "fcl-dialog-ok-cancel",
    templateUrl: "./dialog-ok-cancel.component.html",
    styleUrls: ["./dialog-ok-cancel.component.scss"],
})
export class DialogOkCancelComponent {
    dialogData: DialogOkCancelData;

    constructor(
        public dialogRef: MatDialogRef<DialogOkCancelComponent>,
        @Inject(MAT_DIALOG_DATA) public data: DialogOkCancelData,
    ) {
        this.dialogData = data;
    }

    cancelDialog() {
        this.dialogRef.close(Constants.DIALOG_CANCEL);
    }

    okDialog() {
        this.dialogRef.close(Constants.DIALOG_OK);
    }
}
