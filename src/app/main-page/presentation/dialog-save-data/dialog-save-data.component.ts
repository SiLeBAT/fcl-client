import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Constants } from '@app/tracing/util/constants';

@Component({
    selector: 'fcl-dialog-save-data',
    templateUrl: './dialog-save-data.component.html',
    styleUrls: ['./dialog-save-data.component.scss']
})
export class DialogSaveDataComponent {
    cancel: string = Constants.DIALOG_CANCEL;
    dontSave: string = Constants.DIALOG_DONT_SAVE;
    save: string = Constants.DIALOG_SAVE;

    constructor(
        public dialogRef: MatDialogRef<DialogSaveDataComponent>,
        @Inject(MAT_DIALOG_DATA) public data: {fileName: string}
    ) { }

    cancelDialog() {
        this.dialogRef.close(this.cancel);
    }

    dontSaveAndCloseDialog() {
        this.dialogRef.close(this.dontSave);
    }

    saveAndCloseDialog() {
        this.dialogRef.close(this.save);
    }
}
