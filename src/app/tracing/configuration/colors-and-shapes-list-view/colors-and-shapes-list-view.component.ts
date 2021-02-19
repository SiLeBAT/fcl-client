import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { StationHighlightingData } from '@app/tracing/data.model';
import { HighlightingRuleDeleteRequestData } from '../configuration.model';

@Component({
    selector: 'fcl-colors-and-shapes-list-view',
    templateUrl: './colors-and-shapes-list-view.component.html',
    styleUrls: ['./colors-and-shapes-list-view.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class ColorsAndShapesListViewComponent {

    @Input() colorsAndShapesHighlightings: StationHighlightingData[] = [];
    @Input() listButtonDisabled = false;

    @Output() deleteHighlightingRule = new EventEmitter<HighlightingRuleDeleteRequestData>();
    @Output() toggleShowInLegendProperty = new EventEmitter<StationHighlightingData[]>();

    onDeleteHighlightingRule(event: MouseEvent, rule: StationHighlightingData, indexToDelete: number) {
        const newColorsAndShapesHighlightings = this.colorsAndShapesHighlightings
            .filter((item, index) => index !== indexToDelete);

        this.deleteHighlightingRule.emit({
            highlightingData: newColorsAndShapesHighlightings,
            highlightingRule: rule,
            xPos: event.clientX,
            yPos: event.clientY
        });
    }

    onToggleShowInLegend(index: number) {
        const showInLegend: boolean = this.colorsAndShapesHighlightings[index].showInLegend;
        const newColorsAndShapesHighlightings = [
            ...this.colorsAndShapesHighlightings
        ];
        newColorsAndShapesHighlightings[index].showInLegend = !showInLegend;

        this.toggleShowInLegendProperty.emit(newColorsAndShapesHighlightings);
    }
}
