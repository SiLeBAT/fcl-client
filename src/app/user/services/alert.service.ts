import { Injectable } from '@angular/core';
import { MatSnackBarConfig, MatSnackBarVerticalPosition } from '@angular/material';
import { Subject } from 'rxjs';

export interface INotification {
    text: string;
    config: MatSnackBarConfig;
}

@Injectable({
    providedIn: 'root'
})
export class AlertService {
    subjNotification = new Subject<INotification>();
    private duration = 5000;
    private verticalPosition: MatSnackBarVerticalPosition = 'bottom';

    success(message: string) {
        this.publishNotification(message, ['snackbar-success']);
    }

    error(message: string) {
        this.publishNotification(message, ['snackbar-error']);

    }

    warn(message: string) {
        this.publishNotification(message, ['snackbar-warn']);
    }

    info(message: string) {
        this.publishNotification(message, ['snackbar-info']);
    }

    private publishNotification(message: string, panelClass: string[]) {
        const config = new MatSnackBarConfig();
        config.duration = this.duration;
        config.verticalPosition = this.verticalPosition;
        config.panelClass = panelClass;

        const notification: INotification = {
            text: message,
            config: config
        };

        this.subjNotification.next(notification);
    }

}
