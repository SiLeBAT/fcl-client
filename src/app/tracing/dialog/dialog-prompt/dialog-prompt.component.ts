import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

export interface DialogPromptData {
    title: string;
    message: string;
    placeholder: string;
}

@Component({
    selector: 'fcl-dialog-prompt',
    templateUrl: './dialog-prompt.component.html'
})
export class DialogPromptComponent {

  //noinspection JSUnusedGlobalSymbols
    value: string;

    constructor(public dialogRef: MatDialogRef<DialogPromptComponent>, @Inject(MAT_DIALOG_DATA) public data: DialogPromptData) {
    }

}
