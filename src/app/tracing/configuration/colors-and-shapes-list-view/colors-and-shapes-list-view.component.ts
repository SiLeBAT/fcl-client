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

    @Input() colorsAndShapesRules: StationHighlightingData[] = [];
    @Input() listButtonDisabled = false;

    @Output() deleteHighlightingRule = new EventEmitter<HighlightingRuleDeleteRequestData>();
    @Output() toggleShowInLegendProperty = new EventEmitter<StationHighlightingData[]>();

    onDeleteHighlightingCondition(event: MouseEvent, condition: StationHighlightingData, indexToDelete: number) {
        const newHighlightingRules = this.colorsAndShapesRules
            .filter((item, index) => index !== indexToDelete);

        this.deleteHighlightingRule.emit({
            highlightingData: newHighlightingRules,
            highlightingCondition: condition,
            xPos: event.clientX,
            yPos: event.clientY
        });
    }

    onToggleShowInLegend(index: number) {
        const showInLegend: boolean = this.colorsAndShapesRules[index].showInLegend;
        const newColorsAndShapesRules = [
            ...this.colorsAndShapesRules
        ];
        newColorsAndShapesRules[index].showInLegend = !showInLegend;

        this.toggleShowInLegendProperty.emit(newColorsAndShapesRules);
    }
}
