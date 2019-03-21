import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material';

export interface DialogAlertData {
    title: string;
    message: string;
}

@Component({
  // tslint:disable-next-line:component-selector
    selector: 'app-dialog-alert',
    templateUrl: './dialog-alert.component.html',
    styleUrls: ['./dialog-alert.component.css']
})
export class DialogAlertComponent {

    constructor(@Inject(MAT_DIALOG_DATA) public data: DialogAlertData) {
    }

}
