import {
  ChangeDetectionStrategy,
  Component,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import {Color} from '@app/tracing/data.model';
import {ColorEditRule} from '../model';
import {AbstractRuleEditViewComponent} from '../abstract-rule-edit-view';

@Component({
  selector: 'fcl-edge-color-edit-view',
  templateUrl: './edge-color-edit-view.component.html',
  styleUrls: ['./edge-color-edit-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EdgeColorEditViewComponent
  extends AbstractRuleEditViewComponent<ColorEditRule>
  implements OnChanges
{
  private static readonly DISABLED_ACTION_TOOLTIP =
    'Please enter name, select colour as well as conditions';

  get color(): Color | undefined {
    return this.rule?.color;
  }

  get disabledActionToolTip(): string {
    return EdgeColorEditViewComponent.DISABLED_ACTION_TOOLTIP;
  }

  constructor() {
    super();
  }

  ngOnChanges(changes: SimpleChanges): void {
    super.ngOnChanges(changes);
  }

  onColorChange(color: Color): void {
    this.changeRule({color: color});
  }
}
