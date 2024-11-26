import { Component, OnInit } from "@angular/core";
import {
    MatLegacySnackBar as MatSnackBar,
    MatLegacySnackBarConfig as MatSnackBarConfig,
    MatLegacySnackBarRef as MatSnackBarRef,
    LegacyTextOnlySnackBar as TextOnlySnackBar,
} from "@angular/material/legacy-snack-bar";
import { Subscription } from "rxjs";

import { AlertService, INotification } from "../services/alert.service";

@Component({
    selector: "fcl-alert",
    templateUrl: "./alert.component.html",
})
export class AlertComponent implements OnInit {
    constructor(
        private alertService: AlertService,
        private snackBar: MatSnackBar,
    ) {}

    ngOnInit() {
        this.alertService.notification$.subscribe(
            (notification) => {
                this.showToaster(notification);
            },
            (error) => {
                throw new Error(`error showing toaster: ${error}`);
            },
        );
    }

    showToaster(notification: INotification) {
        const { text, config, action } = notification;
        const autoDismiss = !!config.duration;
        const snackBarRef = this.snackBar.open(
            text,
            action?.action ?? (!autoDismiss ? "Ok" : ""),
            config,
        );

        if (!autoDismiss) {
            this.dismissSnackBarOnOutsideSnackBarClick(snackBarRef);
        }
        if (action?.onClick) {
            snackBarRef.onAction().subscribe(action.onClick);
        }
    }

    private dismissSnackBarOnOutsideSnackBarClick(
        snackBarRef: MatSnackBarRef<TextOnlySnackBar>,
    ): void {
        const snackBarContainers = document.getElementsByClassName(
            "mat-snack-bar-container",
        );
        if (snackBarContainers.length > 0) {
            const snackBarContainer = snackBarContainers.item(
                snackBarContainers.length - 1,
            )!;
            const fun = (e: any) => {
                if (!snackBarContainer.contains(e.target)) {
                    // Clicked outside the snackbar box
                    snackBarRef.dismiss();
                }
            };

            let subscription: Subscription | null = null;
            const dismissed = () => {
                window.removeEventListener("click", fun);
                if (subscription) {
                    subscription.unsubscribe();
                    subscription = null;
                }
            };
            subscription = snackBarRef.afterDismissed().subscribe(dismissed);

            window.addEventListener("click", fun);
        }
    }
}
