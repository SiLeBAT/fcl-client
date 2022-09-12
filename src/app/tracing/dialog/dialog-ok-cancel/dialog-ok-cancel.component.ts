import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface DialogOkCancelData {
    title: string;
    content1: string;
    content2?: string;
    cancelText: string;
    okText: string;
}

@Component({
    selector: 'fcl-dialog-ok-cancel',
    templateUrl: './dialog-ok-cancel.component.html',
    styleUrls: ['./dialog-ok-cancel.component.scss']
})
export class DialogOkCancelComponent {
    dialogData: DialogOkCancelData;

    constructor(
        public dialogRef: MatDialogRef<DialogOkCancelComponent>,
        @Inject(MAT_DIALOG_DATA) public data: DialogOkCancelData
    ) {
        this.dialogData = data;
    }

    cancelDialog() {
        this.dialogRef.close(this.data.cancelText);
    }

    dontSaveAndCloseDialog() {
        this.dialogRef.close(this.data.okText);
    }
}
