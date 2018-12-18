import { Injectable, EventEmitter } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class AppService {
    doToggleLeftSidebar: EventEmitter<any>;
    doToggleRightSidebar: EventEmitter<any>;
    doSaveImage: EventEmitter<any>;
    doOnLoad: EventEmitter<any>;
    doInputEmpty: EventEmitter<any>;
    doOnSave: EventEmitter<any>;
    private tracingActive = false;

    constructor() {
        this.doToggleLeftSidebar = new EventEmitter<any>();
        this.doToggleRightSidebar = new EventEmitter<any>();
        this.doSaveImage = new EventEmitter<any>();
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
