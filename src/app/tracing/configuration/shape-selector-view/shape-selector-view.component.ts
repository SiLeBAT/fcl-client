import { Component, Input, ViewEncapsulation, Output, EventEmitter } from '@angular/core';
import { NodeShapeType } from '@app/tracing/data.model';
import { Constants } from '@app/tracing/util/constants';

@Component({
    selector: 'fcl-shape-selector-view',
    templateUrl: './shape-selector-view.component.html',
    encapsulation: ViewEncapsulation.None
})
export class ShapeSelectorViewComponent {

    @Input() value: (NodeShapeType | string);
    @Input() set availableShapeTypes(value: (NodeShapeType | string)[]) {
        this.availableShapeTypes_ = value;
    }

    get availableShapeTypes(): (NodeShapeType | string)[] {
        return this.availableShapeTypes_;
    }
    private availableShapeTypes_: (NodeShapeType | string)[];

    @Output() valueChange = new EventEmitter<(NodeShapeType | string)>();

    private shapeLabel: { [key in (NodeShapeType | string)]: string } = {
        [Constants.NOSHAPE_TYPE]: '- no shape -',
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

    getShapeLabel(type: (NodeShapeType | string)): string {
        return this.shapeLabel[type];
    }

    onValueChange(value: (NodeShapeType | string)): void {
        this.value = value;
        this.valueChange.emit(value);
    }
}
