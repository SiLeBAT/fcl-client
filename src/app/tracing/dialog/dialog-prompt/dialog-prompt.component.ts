import { Component, Inject } from "@angular/core";
import {
    MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
    MatLegacyDialogRef as MatDialogRef,
} from "@angular/material/legacy-dialog";

export interface DialogPromptData {
    title: string;
    message: string;
    placeholder: string;
}

@Component({
    selector: "fcl-dialog-prompt",
    templateUrl: "./dialog-prompt.component.html",
})
export class DialogPromptComponent {
    //noinspection JSUnusedGlobalSymbols
    value: string;

    constructor(
        public dialogRef: MatDialogRef<DialogPromptComponent>,
        @Inject(MAT_DIALOG_DATA) public data: DialogPromptData,
    ) {}
}
