import {Component, Inject} from '@angular/core';
import {MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA} from '@angular/material/legacy-dialog';

export interface DialogAlertData {
  title: string;
  message: string;
}

@Component({
  selector: 'fcl-dialog-alert',
  templateUrl: './dialog-alert.component.html',
})
export class DialogAlertComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: DialogAlertData) {}
}
