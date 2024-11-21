import { Injectable } from "@angular/core";
import {
    MatLegacySnackBarConfig as MatSnackBarConfig,
    MatLegacySnackBarVerticalPosition as MatSnackBarVerticalPosition,
} from "@angular/material/legacy-snack-bar";
import { Subject } from "rxjs";

export interface AlertAction {
    action: string;
    onClick?: () => void;
}
export interface INotification {
    text: string;
    config: MatSnackBarConfig;
    action?: AlertAction;
}

@Injectable({
    providedIn: "root",
})
export class AlertService {
    private subjNotification = new Subject<INotification>();
    private duration = 5000;
    private verticalPosition: MatSnackBarVerticalPosition = "bottom";
    notification$ = this.subjNotification.asObservable();

    success(message: string, action?: AlertAction) {
        this.publishNotification(message, ["snackbar-success"], true, action);
    }

    error(message: string, action?: AlertAction) {
        this.publishNotification(message, ["snackbar-error"], false, action);
    }

    warn(message: string, action?: AlertAction) {
        this.publishNotification(message, ["snackbar-warn"], false, action);
    }

    info(message: string, action?: AlertAction) {
        this.publishNotification(message, ["snackbar-info"], true, action);
    }

    private publishNotification(
        message: string,
        panelClass: string[],
        autoDismiss: boolean,
        action?: AlertAction,
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
            action: action,
        };

        this.subjNotification.next(notification);
    }
}
