import {Observable} from 'rxjs';

export function optInGate(
  gateIsOpen$: Observable<boolean>,
  waitingEnabled: boolean
) {
  return function <T>(source: Observable<T>): Observable<T> {
    return new Observable(subscriber => {
      let isSourceEmitWaiting = false;
      let waitingSourceEmit: T | null = null;
      let gateIsOpen = false;
      const gateSubscription = gateIsOpen$.subscribe({
        next: function (value) {
          if (value !== gateIsOpen) {
            gateIsOpen = value;
            if (gateIsOpen && isSourceEmitWaiting) {
              // gate was opened and source emit is waiting
              isSourceEmitWaiting = false;
              subscriber.next(waitingSourceEmit!);
            }
          }
        },
        error: function (error) {
          subscriber.error(error);
        },
        complete: function () {
          subscriber.complete();
        },
      });
      const sourceSubscription = source.subscribe({
        next: function (value) {
          if (gateIsOpen) {
            subscriber.next(value);
          } else if (waitingEnabled) {
            isSourceEmitWaiting = true;
            waitingSourceEmit = value;
          }
        },
        error: function (error) {
          subscriber.error(error);
        },
        complete: function () {
          subscriber.complete();
        },
      });

      return () => {
        gateSubscription.unsubscribe();
        sourceSubscription.unsubscribe();
      };
    });
  };
}
