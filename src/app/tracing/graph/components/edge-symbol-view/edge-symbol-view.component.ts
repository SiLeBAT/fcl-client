import {Component, Input, ChangeDetectionStrategy} from '@angular/core';
import {Color} from '@app/tracing/data.model';
import {Utils} from '@app/tracing/util/non-ui-utils';

@Component({
  selector: 'fcl-edge-symbol-view',
  templateUrl: './edge-symbol-view.component.html',
  styleUrls: ['./edge-symbol-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EdgeSymbolViewComponent {
  private _edgeColor: string;

  @Input() set edgeColor(color: Color) {
    this._edgeColor = color ? Utils.colorToCss(color) : 'none';
  }

  getEdgeColor(): string {
    return this._edgeColor;
  }
}
