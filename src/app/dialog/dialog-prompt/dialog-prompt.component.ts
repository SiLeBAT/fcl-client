import {Component, Inject} from '@angular/core';
import {MdDialogRef, MD_DIALOG_DATA} from '@angular/material';

export interface DialogPromptData {
  title: string;
  message: string;
  placeholder: string;
}

@Component({
  selector: 'app-dialog-prompt',
  templateUrl: './dialog-prompt.component.html',
  styleUrls: ['./dialog-prompt.component.css']
})
export class DialogPromptComponent {

  //noinspection JSUnusedGlobalSymbols
  value: string;

  constructor(public dialogRef: MdDialogRef<DialogPromptComponent>, @Inject(MD_DIALOG_DATA) public data: DialogPromptData) {
  }

}
