import { Component, Input, ViewEncapsulation, Output, EventEmitter } from '@angular/core';
import { NodeShapeType } from '@app/tracing/data.model';

@Component({
    selector: 'fcl-shape-selector-view',
    templateUrl: './shape-selector-view.component.html',
    styleUrls: ['./shape-selector-view.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class ShapeSelectorViewComponent {

    private static readonly NO_SHAPE_LABEL = '- no shape -';

    @Input() value: (NodeShapeType | null);
    @Input() set availableShapeTypes(value: (NodeShapeType | null)[]) {
        this.availableShapeTypes_ = value;
    }

    get availableShapeTypes(): (NodeShapeType | null)[] {
        return this.availableShapeTypes_;
    }
    private availableShapeTypes_: (NodeShapeType | null)[];

    @Output() valueChange = new EventEmitter<(NodeShapeType | null)>();

    private shapeLabel: Record<NodeShapeType, string> = {
        [NodeShapeType.CIRCLE]: 'Circle',
        [NodeShapeType.DIAMOND]: 'Diamond',
        [NodeShapeType.HEXAGON]: 'Hexagon',
        [NodeShapeType.OCTAGON]: 'Octagon',
        [NodeShapeType.PENTAGON]: 'Pentagon',
        [NodeShapeType.SQUARE]: 'Square',
        [NodeShapeType.STAR]: 'Star',
        [NodeShapeType.TRIANGLE]: 'Triangle'
    };

    constructor() { }

    getShapeLabel(type: (NodeShapeType | null)): string {
        return type === null ? ShapeSelectorViewComponent.NO_SHAPE_LABEL : this.shapeLabel[type];
    }

    onValueChange(value: (NodeShapeType | null)): void {
        this.value = value;
        this.valueChange.emit(value);
    }
}
