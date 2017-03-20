import {Component, Inject} from '@angular/core';
import {MD_DIALOG_DATA} from '@angular/material';

import {DialogActionsData} from './dialog-actions.data';

@Component({
  templateUrl: './dialog-actions.component.html',
  styleUrls: ['./dialog-actions.component.css']
})
export class DialogActionsComponent {

  constructor(@Inject(MD_DIALOG_DATA) public data: DialogActionsData) {
  }

}
