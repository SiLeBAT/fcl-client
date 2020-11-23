import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface DialogActionsData {
    title: string;
    actions: { name: string, action: () => void }[];
}

@Component({
    templateUrl: './dialog-actions.component.html'
})
export class DialogActionsComponent {

    constructor(@Inject(MAT_DIALOG_DATA) public data: DialogActionsData) {
    }

}
