import { Component, OnChanges, SimpleChanges, ChangeDetectionStrategy } from '@angular/core';
import { RuleType, StationEditRule } from '../model';
import { HighlightingElementViewComponent } from '../highlighting-element-view/highlighting-element-view.component';

@Component({
    selector: 'fcl-highlighting-station-view',
    templateUrl: './highlighting-station-view.component.html',
    styleUrls: ['../highlighting-element-view/highlighting-element-view.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HighlightingStationViewComponent
    extends HighlightingElementViewComponent<StationEditRule> implements OnChanges {

    sizeOpenState = false;

    constructor() {
        super();
        this.setOpenState(RuleType.COLOR_AND_SHAPE, true);
    }

    ngOnChanges(changes: SimpleChanges): void {
        super.ngOnChanges(changes);
    }
}
