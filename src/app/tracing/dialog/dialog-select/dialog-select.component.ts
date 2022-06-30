import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface DialogSelectData {
    title: string;
    options: { value: string; viewValue: string; selected: boolean }[];
    favoriteColumnLength: number;
}

@Component({
    selector: 'fcl-dialog-select',
    templateUrl: './dialog-select.component.html',
    styleUrls: ['./dialog-select.component.scss']
})
export class DialogSelectComponent {

    options: any[];
    favoriteColumnSet: any[];
    additionalColumnSet: any[];

    constructor(public dialogRef: MatDialogRef<DialogSelectComponent>, @Inject(MAT_DIALOG_DATA) public data: DialogSelectData) {
        this.options = JSON.parse(JSON.stringify(data.options));
        this.favoriteColumnSet = this.options.slice(0, data.favoriteColumnLength);
        this.additionalColumnSet = this.options.slice(data.favoriteColumnLength);
    }

    //noinspection JSUnusedGlobalSymbols
    close() {
        this.dialogRef.close(this.options.filter(o => o.selected).map(o => o.value));
    }

}
