import { Component, OnInit } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

import { AlertService, INotification } from '../services/alert.service';

@Component({
    selector: 'fcl-alert',
    templateUrl: './alert.component.html'
})
export class AlertComponent implements OnInit {

    constructor(private alertService: AlertService,
                private snackBar: MatSnackBar) { }

    ngOnInit() {
        this.alertService.notification$.subscribe(notification => {
            this.showToaster(notification);
        },
            (error => {
                throw new Error(`error showing toaster: ${error}`);
            }));
    }

    showToaster(notification: INotification) {
        const text = notification.text;
        const config: MatSnackBarConfig = notification.config;
        this.snackBar.open(text, '', config);
    }
}
