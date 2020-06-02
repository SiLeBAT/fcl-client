import { Component, OnInit, Output, Input, EventEmitter } from '@angular/core';
import { PropInfo } from '@app/tracing/shared/property-info';

@Component({
    selector: 'fcl-property-element-view',
    templateUrl: './property-element-view.component.html',
    styleUrls: ['./property-element-view.component.scss']
})
export class PropertyElementViewComponent implements OnInit {

    @Input() availableProps: PropInfo[];
    @Input() prop: string;
    @Input() altText: string;

    @Output() propChange = new EventEmitter<string>();
    @Output() altTextChange = new EventEmitter<string>();

    constructor() { }

    ngOnInit() {
    }

    isActivePropAvailable(): boolean {
        return this.availableProps.some((p) => p.prop === this.prop);
    }

    setProperty(prop: string): void {
        this.propChange.emit(this.prop);
    }

    onAltTextChange(altText: string): void {
        this.altTextChange.emit(altText);
    }

}
