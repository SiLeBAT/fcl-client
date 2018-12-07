import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

export interface DialogSelectData {
    title: string;
    options: { value: string, viewValue: string, selected: boolean }[];
}

@Component({
  // tslint:disable-next-line:component-selector
    selector: 'app-dialog-select',
    templateUrl: './dialog-select.component.html',
    styleUrls: ['./dialog-select.component.css']
})
export class DialogSelectComponent {

    options: any[];

    constructor(public dialogRef: MatDialogRef<DialogSelectComponent>, @Inject(MAT_DIALOG_DATA) public data: DialogSelectData) {
        this.options = JSON.parse(JSON.stringify(data.options));
    }

  //noinspection JSUnusedGlobalSymbols
    close() {
        this.dialogRef.close(this.options.filter(o => o.selected).map(o => o.value));
    }

}
