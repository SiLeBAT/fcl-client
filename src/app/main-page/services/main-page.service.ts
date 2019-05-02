import { Injectable, EventEmitter } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class MainPageService {
    doSaveImage: EventEmitter<any>;
    doVisioLayout: EventEmitter<any>;
    doOnSave: EventEmitter<any>;
    doInputEmpty: EventEmitter<any>;

    constructor() {
        this.doSaveImage = new EventEmitter<any>();
        this.doVisioLayout = new EventEmitter<any>();
        this.doOnSave = new EventEmitter<any>();
        this.doInputEmpty = new EventEmitter<any>();
    }

    onSaveImage() {
        this.doSaveImage.emit();
    }

    onVisioLayout() {
        this.doVisioLayout.emit();
    }

    setInputEmpty() {
        this.doInputEmpty.emit();
    }

    onSave() {
        this.doOnSave.emit();
    }
}
