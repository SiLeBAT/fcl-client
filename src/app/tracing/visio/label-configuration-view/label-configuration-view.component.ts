import {Component, Input} from '@angular/core';
import {AmountUnitPair, LabelElementInfo, PropElementInfo} from '../model';
import {getUnitPropFromAmountProp} from '../shared';

@Component({
  selector: 'fcl-label-configuration-view',
  templateUrl: './label-configuration-view.component.html',
  styleUrls: ['./label-configuration-view.component.scss'],
})
export class LabelConfigurationViewComponent {
  @Input() labelElements: LabelElementInfo[][];
  @Input() availableProps: {prop: string; label: string}[];
  @Input() amountUnitPairs: AmountUnitPair[] = [];

  onPropElementPropChange(
    propElement: PropElementInfo,
    prop: string | null
  ): void {
    propElement.prop = prop;
    for (const pair of this.amountUnitPairs) {
      if (pair.amount === propElement && propElement.prop !== null) {
        pair.unit.prop = getUnitPropFromAmountProp(
          propElement.prop,
          this.availableProps
        );
      }
    }
  }

  onPropElementAltTextChange(
    propElement: PropElementInfo,
    altText: string
  ): void {
    propElement.altText = altText;
  }
}
