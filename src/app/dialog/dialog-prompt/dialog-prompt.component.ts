import {Component, Inject} from '@angular/core';
import {MdDialogRef, MD_DIALOG_DATA} from '@angular/material';

import {DialogPromptData} from './dialog-prompt.data';

@Component({
  selector: 'app-dialog-prompt',
  templateUrl: './dialog-prompt.component.html',
  styleUrls: ['./dialog-prompt.component.css']
})
export class DialogPromptComponent {

  value: string;

  constructor(public dialogRef: MdDialogRef<DialogPromptComponent>, @Inject(MD_DIALOG_DATA) public data: DialogPromptData) {
  }

}
