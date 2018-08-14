import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

import { LoaderState } from './spinner-loader.component';

@Injectable()
export class SpinnerLoaderService {
  private loaderSubject = new Subject<LoaderState>();
  public loaderState = this.loaderSubject.asObservable();

  constructor() {}

  show() {
    this.loaderSubject.next(<LoaderState>{ show: true });
  }

  hide() {
    this.loaderSubject.next(<LoaderState>{ show: false });
  }
}
