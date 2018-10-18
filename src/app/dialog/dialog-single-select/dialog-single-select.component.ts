import {Component, Inject} from '@angular/core';
import {MD_DIALOG_DATA, MdDialogRef} from '@angular/material';

export interface DialogSingleSelectData {
  title: string;
  options: { value: string, viewValue: string }[];
  value: string;
}

@Component({
  selector: 'app-dialog-single-select',
  templateUrl: './dialog-single-select.component.html',
  styleUrls: ['./dialog-single-select.component.css']
})
export class DialogSingleSelectComponent {

  options: any[];

  constructor(public dialogRef: MdDialogRef<DialogSingleSelectComponent>, @Inject(MD_DIALOG_DATA) public data: DialogSingleSelectData) {
    this.options = JSON.parse(JSON.stringify(data.options));
  }

  //noinspection JSUnusedGlobalSymbols
  close() {
    this.dialogRef.close(this.data.value);
  }

}
