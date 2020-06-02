import { Injectable, EventEmitter } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class MainPageService {
    doSaveImage: EventEmitter<any>;
    doROALayout: EventEmitter<any>;
    doOnSave: EventEmitter<any>;
    doInputEmpty: EventEmitter<any>;

    constructor() {
        this.doSaveImage = new EventEmitter<any>();
        this.doROALayout = new EventEmitter<any>();
        this.doOnSave = new EventEmitter<any>();
        this.doInputEmpty = new EventEmitter<any>();
    }

    onSaveImage() {
        this.doSaveImage.emit();
    }

    onROALayout() {
        this.doROALayout.emit();
    }

    setInputEmpty() {
        this.doInputEmpty.emit();
    }

    onSave() {
        this.doOnSave.emit();
    }
}
