import { Injectable } from "@angular/core";
import {
    MatLegacySnackBarConfig as MatSnackBarConfig,
    MatLegacySnackBarVerticalPosition as MatSnackBarVerticalPosition,
} from "@angular/material/legacy-snack-bar";
import { Subject } from "rxjs";

export interface INotification {
    text: string;
    config: MatSnackBarConfig;
}

@Injectable({
    providedIn: "root",
})
export class AlertService {
    private subjNotification = new Subject<INotification>();
    private duration = 5000;
    private verticalPosition: MatSnackBarVerticalPosition = "bottom";
    notification$ = this.subjNotification.asObservable();

    success(message: string) {
        this.publishNotification(message, ["snackbar-success"], true);
    }

    error(message: string) {
        this.publishNotification(message, ["snackbar-error"], false);
    }

    warn(message: string) {
        this.publishNotification(message, ["snackbar-warn"], true);
    }

    info(message: string) {
        this.publishNotification(message, ["snackbar-info"], true);
    }

    private publishNotification(
        message: string,
        panelClass: string[],
        autoDismiss: boolean,
    ) {
        const config = new MatSnackBarConfig();
        if (autoDismiss) {
            config.duration = this.duration;
        }
        config.verticalPosition = this.verticalPosition;
        config.panelClass = panelClass;

        const notification: INotification = {
            text: message,
            config: config,
        };

        this.subjNotification.next(notification);
    }
}
