import { Component, OnInit } from '@angular/core';
import { Constants } from '../../util/constants';
import { Utils } from '../../util/non-ui-utils';

@Component({
    selector: 'fcl-graph-legend',
    templateUrl: './graph-legend.component.html',
    styleUrls: ['./graph-legend.component.scss']
})
export class GraphLegendComponent implements OnInit {

    legend: {
        name: string;
        color: string;
    }[] = Constants.PROPERTIES_WITH_COLORS.toArray().map(p => {
        const prop = Constants.PROPERTIES.get(p);

        return {
            name: prop.name,
            color: Utils.colorToCss(prop.color)
        };
    });

    constructor() { }

    ngOnInit() {
    }

}
