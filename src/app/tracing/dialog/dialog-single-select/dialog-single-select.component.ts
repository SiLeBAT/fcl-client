import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

export interface DialogSingleSelectData {
    title: string;
    message: string;
    options: { value: string, viewValue: string, toolTip: string }[];
    value: string;
}

@Component({
    selector: 'fcl-dialog-single-select',
    templateUrl: './dialog-single-select.component.html',
    styleUrls: ['./dialog-single-select.component.scss']
})
export class DialogSingleSelectComponent {

    options: any[];

    constructor(public dialogRef: MatDialogRef<DialogSingleSelectComponent>, @Inject(MAT_DIALOG_DATA) public data: DialogSingleSelectData) {
        this.options = JSON.parse(JSON.stringify(data.options));
    }

  //noinspection JSUnusedGlobalSymbols
    close() {
        this.dialogRef.close(this.data.value);
    }

}
