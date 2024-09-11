import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core';
import {NodeShapeType} from '@app/tracing/data.model';

@Component({
  selector: 'fcl-shape-selector-view',
  templateUrl: './shape-selector-view.component.html',
  styleUrls: ['./shape-selector-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShapeSelectorViewComponent {
  @Input() value: NodeShapeType | null;
  @Input() disabled = false;

  availableShapeTypes: NodeShapeType[] = [
    NodeShapeType.CIRCLE,
    NodeShapeType.DIAMOND,
    NodeShapeType.HEXAGON,
    NodeShapeType.OCTAGON,
    NodeShapeType.PENTAGON,
    NodeShapeType.SQUARE,
    NodeShapeType.STAR,
    NodeShapeType.TRIANGLE,
  ];

  @Output() valueChange = new EventEmitter<NodeShapeType>();

  private shapeLabel: Record<NodeShapeType, string> = {
    [NodeShapeType.CIRCLE]: 'Circle',
    [NodeShapeType.DIAMOND]: 'Diamond',
    [NodeShapeType.HEXAGON]: 'Hexagon',
    [NodeShapeType.OCTAGON]: 'Octagon',
    [NodeShapeType.PENTAGON]: 'Pentagon',
    [NodeShapeType.SQUARE]: 'Square',
    [NodeShapeType.STAR]: 'Star',
    [NodeShapeType.TRIANGLE]: 'Triangle',
  };

  getShapeLabel(type: NodeShapeType): string {
    return this.shapeLabel[type];
  }

  onValueChange(value: NodeShapeType): void {
    this.value = value;
    this.valueChange.emit(value);
  }
}
