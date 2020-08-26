import { Component, OnInit, Output, Input, ViewChild, EventEmitter } from '@angular/core';
import { MatSlider } from '@angular/material/slider';

@Component({
    selector: 'fcl-zoom-view',
    templateUrl: './zoom-view.component.html',
    styleUrls: ['./zoom-view.component.scss']
})
export class ZoomViewComponent implements OnInit {

    @Input() zoomValue: number;

    @Output() zoomReset = new EventEmitter();
    @Output() zoomIn = new EventEmitter();
    @Output() zoomOut = new EventEmitter();
    @Output() zoomSlide = new EventEmitter();
    @Output() zoomSlided = new EventEmitter();

    @ViewChild('slider', { static: true }) slider: MatSlider;

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
