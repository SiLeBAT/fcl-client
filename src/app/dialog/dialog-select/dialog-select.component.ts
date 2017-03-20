import {Component, Inject} from '@angular/core';
import {MdDialogRef, MD_DIALOG_DATA} from '@angular/material';

import {DialogSelectData} from './dialog-select.data';

@Component({
  selector: 'app-dialog-select',
  templateUrl: './dialog-select.component.html',
  styleUrls: ['./dialog-select.component.css']
})
export class DialogSelectComponent {

  options: any[];

  constructor(public dialogRef: MdDialogRef<DialogSelectComponent>, @Inject(MD_DIALOG_DATA) public data: DialogSelectData) {
    this.options = data.options.map(option => {
      return {
        name: option[0],
        selected: option[1]
      };
    });
  }

  close() {
    this.dialogRef.close(this.options.filter(o => o.selected).map(o => o.name));
  }

}
