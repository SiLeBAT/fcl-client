import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import * as _ from 'lodash';

export interface Option {
    value: string;
    viewValue: string;
    selected: boolean;
    disabled?: boolean | undefined;
    tooltip?: string;
}

export interface DialogSelectData {
    title: string;
    favouriteOptions: Option[];
    otherOptions: Option[];
}

@Component({
    selector: 'fcl-dialog-select',
    templateUrl: './dialog-select.component.html',
    styleUrls: ['./dialog-select.component.scss']
})
export class DialogSelectComponent {

    favouriteOptions: Option[];
    otherOptions: Option[];

    constructor(public dialogRef: MatDialogRef<DialogSelectComponent>, @Inject(MAT_DIALOG_DATA) public data: DialogSelectData) {
        this.favouriteOptions = _.cloneDeep(data.favouriteOptions);
        this.otherOptions = _.cloneDeep(data.otherOptions);
    }

    //noinspection JSUnusedGlobalSymbols
    close() {
        this.dialogRef.close(
            [].concat(this.favouriteOptions, this.otherOptions)
                .filter(o => o.selected && !o.disabled).map(o => o.value)
        );
    }

}
