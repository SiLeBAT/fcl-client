import { Component, OnChanges, SimpleChanges, ChangeDetectionStrategy } from '@angular/core';
import * as _ from 'lodash';
import { DeliveryEditRule, RuleType } from '../model';
import { HighlightingElementViewComponent } from '../highlighting-element-view/highlighting-element-view.component';

@Component({
    selector: 'fcl-highlighting-delivery-view',
    templateUrl: './highlighting-delivery-view.component.html',
    styleUrls: ['../highlighting-element-view/highlighting-element-view.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HighlightingDeliveryViewComponent
    extends HighlightingElementViewComponent<DeliveryEditRule> implements OnChanges {

    widthOpenState = false;

    constructor() {
        super();
        this.setOpenState(RuleType.COLOR, true);
    }

    ngOnChanges(changes: SimpleChanges): void {
        super.ngOnChanges(changes);
    }
}
