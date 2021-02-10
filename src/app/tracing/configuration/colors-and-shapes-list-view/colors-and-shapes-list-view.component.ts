import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { StationHighlightingData } from '@app/tracing/data.model';
import { HighlightingConditionToDelete } from '../configuration.model';

@Component({
    selector: 'fcl-colors-and-shapes-list-view',
    templateUrl: './colors-and-shapes-list-view.component.html',
    styleUrls: ['./colors-and-shapes-list-view.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class ColorsAndShapesListViewComponent {

    @Input() colorsAndShapesHighlightings: StationHighlightingData[] = [];
    @Input() listButtonDisabled = false;
    @Output() deleteHighlightingCondition = new EventEmitter<HighlightingConditionToDelete>();

    onDeleteHighlightingCondition(event: MouseEvent, condition: StationHighlightingData, indexToDelete: number) {

        const newHighlightingConditions = this.colorsAndShapesHighlightings
            .filter((item, index) => index !== indexToDelete);

        this.deleteHighlightingCondition.emit({
            highlightingData: newHighlightingConditions,
            highlightingCondition: condition,
            xPos: event.clientX,
            yPos: event.clientY
        });
    }
}
