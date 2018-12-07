import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

import { LoaderState } from './spinner-loader.component';

@Injectable()
export class SpinnerLoaderService {
    private loaderSubject = new Subject<LoaderState>();
    loaderState = this.loaderSubject.asObservable();

    constructor() {}

    show() {
        this.loaderSubject.next({ show: true } as LoaderState);
    }

    hide() {
        this.loaderSubject.next({ show: false } as LoaderState);
    }
}
