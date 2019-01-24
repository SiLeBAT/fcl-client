import { Component, OnInit } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material';

import { AlertService, INotification } from '../services/alert.service';

@Component({
  // tslint:disable-next-line:component-selector
    selector: 'app-alert',
    templateUrl: './alert.component.html',
    styleUrls: ['./alert.component.css']
})
export class AlertComponent implements OnInit {

    constructor(private alertService: AlertService,
                private snackBar: MatSnackBar) { }

    ngOnInit() {
        this.alertService.notification$.subscribe(notification => {
            this.showToaster(notification);
        });
    }

    showToaster(notification: INotification) {
        const text = notification.text;
        const config: MatSnackBarConfig = notification.config;
        this.snackBar.open(text, '', config);
    }
}
