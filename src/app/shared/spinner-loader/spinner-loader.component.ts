import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

import { SpinnerLoaderService } from './spinner-loader.service';

export interface LoaderState {
  show: boolean;
}

@Component({
  selector: 'app-spinner-loader',
  templateUrl: 'spinner-loader.component.html',
  styleUrls: ['spinner-loader.component.css']
})
export class SpinnerLoaderComponent implements OnInit, OnDestroy {
  show = false;

  private subscription: Subscription;

  constructor(private spinnerService: SpinnerLoaderService) {}

  ngOnInit() {
    this.subscription = this.spinnerService.loaderState.subscribe(
      (state: LoaderState) => {
        this.show = state.show;
      }
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
