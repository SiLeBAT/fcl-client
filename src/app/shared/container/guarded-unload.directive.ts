import {HostListener, Directive} from '@angular/core';

@Directive()
export abstract class GuardedUnloadDirective {
  abstract unloadGuard(): boolean;

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any) {
    if (!this.unloadGuard()) {
      $event.returnValue = true;
    }
  }
}
