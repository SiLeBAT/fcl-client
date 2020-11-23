import { HostListener } from '@angular/core';

export abstract class GuardedUnloadComponent {

    abstract unloadGuard(): boolean;

    @HostListener('window:beforeunload', ['$event'])
    unloadNotification($event: any) {
        if (!this.unloadGuard()) {
            $event.returnValue = true;
        }
    }
}
