import { Observable } from 'rxjs';

export function optInGate(gate: Observable<boolean>) {
    return function<T>(source: Observable<T>): Observable<T> {
        return new Observable(subscriber => {
            let isSourceEmitWaiting = false;
            let waitingSourceEmit: T | null = null;
            let gateIsOpen = false;
            const gateSubscription = gate.subscribe({
                next(value) {
                    if (value !== gateIsOpen) {
                        gateIsOpen = value;
                        if (gateIsOpen && isSourceEmitWaiting) {
                            // gate was opened and source emit is waiting
                            isSourceEmitWaiting = false;
                            subscriber.next(waitingSourceEmit);
                        }
                    }
                },
                error(error) {
                    subscriber.error(error);
                },
                complete() {
                    subscriber.complete();
                }
            });
            const sourceSubscription = source.subscribe({
                next(value) {
                    if (gateIsOpen) {
                        subscriber.next(value);
                    } else {
                        isSourceEmitWaiting = true;
                        waitingSourceEmit = value;
                    }
                },
                error(error) {
                    subscriber.error(error);
                },
                complete() {
                    subscriber.complete();
                }
            });

            return () => {
                gateSubscription.unsubscribe();
                sourceSubscription.unsubscribe();
            };
        });
    };
}
