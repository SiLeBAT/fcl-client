import { Component, OnInit, Output, Input, ViewChild, EventEmitter } from '@angular/core';
import { MatSlider } from '@angular/material';

@Component({
    selector: 'fcl-zoom',
    templateUrl: './zoom.component.html',
    styleUrls: ['./zoom.component.scss']
})
export class ZoomComponent implements OnInit {

    @Input() zoomValue: number;

    @Output() zoomReset = new EventEmitter();
    @Output() zoomIn = new EventEmitter();
    @Output() zoomOut = new EventEmitter();
    @Output() zoomSlide = new EventEmitter();
    @Output() zoomSlided = new EventEmitter();

    @ViewChild('slider') slider: MatSlider;

    constructor() { }

    ngOnInit() {
    }

    slide() {
        this.zoomSlide.emit(this.slider.value.toString());
    }

    sliderChanged() {
        this.zoomSlided.emit(this.slider.value.toString());
    }
}
