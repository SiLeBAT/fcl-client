import { Component, OnInit } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig, MatSnackBarRef, TextOnlySnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';

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
        const autoDismiss = !!config.duration;
        const snackBarRef = this.snackBar.open(text, !autoDismiss ? 'Ok' : '', config);

        if (!autoDismiss) {
            this.dismissSnackBarOnOutsideSnackBarClick(snackBarRef);
        }
    }

    private dismissSnackBarOnOutsideSnackBarClick(snackBarRef: MatSnackBarRef<TextOnlySnackBar>): void {
        const snackBarContainers = document.getElementsByClassName('mat-snack-bar-container');
        if (snackBarContainers.length > 0) {
            const snackBarContainer = snackBarContainers.item(snackBarContainers.length - 1)!;
            const fun = (e: any) => {
                if (!snackBarContainer.contains(e.target)) {
                    // Clicked outside the snackbar box
                    snackBarRef.dismiss();
                }
            };

            let subscription: Subscription | null = null;
            const dismissed = () => {
                window.removeEventListener('click', fun);
                if (subscription) {
                    subscription.unsubscribe();
                    subscription = null;
                }
            };
            subscription = snackBarRef.afterDismissed().subscribe(dismissed);

            window.addEventListener('click', fun);
        }
    }
}
