import { Injectable, EventEmitter } from '@angular/core';


@Injectable()
export class AppService {
  public doToggleLeftSidebar: EventEmitter<any>;
  public doToggleRightSidebar: EventEmitter<any>;
  public doSaveImage: EventEmitter<any>;
  public doVisioLayout: EventEmitter<any>;
  public doOnLoad: EventEmitter<any>;
  public doInputEmpty: EventEmitter<any>;
  public doOnSave: EventEmitter<any>;
  private tracingActive = false;

  constructor() {
    this.doToggleLeftSidebar = new EventEmitter<any>();
    this.doToggleRightSidebar = new EventEmitter<any>();
    this.doSaveImage = new EventEmitter<any>();
    this.doVisioLayout = new EventEmitter<any>();
    this.doOnLoad = new EventEmitter<any>();
    this.doInputEmpty = new EventEmitter<any>();
    this.doOnSave = new EventEmitter<any>();
  }

  onToggleLeftSidebar() {
    this.doToggleLeftSidebar.emit();
  }

  onToggleRightSidebar() {
    this.doToggleRightSidebar.emit();
  }

  onSaveImage() {
    this.doSaveImage.emit();
  }

  onVisioLayout() {
    this.doVisioLayout.emit();
  }

  onLoad(event) {
    this.doOnLoad.emit(event);
  }

  setInputEmpty() {
    this.doInputEmpty.emit();
  }

  onSave() {
    this.doOnSave.emit();
  }


  setTracingActive(active: boolean) {
    this.tracingActive = active;
  }

  isTracingActive() {
    return this.tracingActive;
  }

}
