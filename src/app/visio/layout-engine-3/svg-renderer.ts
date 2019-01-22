import * as _ from 'lodash';
import { VisioBox, VisioReport, NonConvexVisioContainer, BoxType } from './datatypes';
import { GraphSettings } from './graph-settings';

export class SvgRenderer {


    private static readonly BoxColors: Map<BoxType, string> = new Map([
        [BoxType.StationGroup, 'DarkGray '],
        [BoxType.Station, 'White'],
        [BoxType.Lot, 'DeepSkyBlue'],
        [BoxType.SampleNegative, 'DarkSeaGreen'],
        [BoxType.SampleConfirmed, 'IndianRed'],
        [BoxType.SampleProbable, 'Yellow'],
    ]);

    static renderReport(report: VisioReport): string {
        let svg = '<svg height="800" width="800">';
        svg += this.renderElements(report.graph.elements);
        svg += '</svg>';
        return svg;
    }

    static renderElements(boxes: VisioBox[]): string {
        let svg = '';
        for (const box of boxes) {
            // if ( (<NonConvexVisioContainer>box).shape !== undefined) {
            if ( (<NonConvexVisioContainer>box).shape !== undefined) {
                svg += this.renderNonConvexBox(<NonConvexVisioContainer>box);
            } else {
                svg += this.renderSimpleBox(box);
            }
        }
        return svg;
    }


    static renderNonConvexBox(box: NonConvexVisioContainer): string {
        let svg = '<polygon points="' +
        _.tail(box.shape.outerBoundary).map(p => p.x + ', ' + p.y).join(' ') + '" ' +
            'style="stroke:black; fill:' + this.BoxColors.get(box.type) + '; stroke-width: ' + GraphSettings.BORDER_WITH + ';"/>';
        svg += this.renderElements(box.elements);
        return svg;
        /*return
        '<polygon points="' + 50,5   100,5  125,30  125,80 100,105
                   50,105  25,80  25, 30"
          style="stroke:#660000; fill:#cc3333; stroke-width: 3;"/>*/
    }

    static renderSimpleBox(box: VisioBox): string {
        return '<g>' +
        '<rect x="' + box.position.x + '" y="' + box.position.y + '" ' +
        'rx="' + GraphSettings.RADIUS + '" ry="' + GraphSettings.RADIUS + '" ' +
        'width="' + box.size.width + '" height="' + box.size.height + '" ' +
        'style="fill:' + this.BoxColors.get(box.type) + ';stroke:black;stroke-width:' + GraphSettings.BORDER_WITH + ';opacity:0.5" />' +
        '</g>';
    }
}


export function renderReport(report: VisioReport): string {
    return SvgRenderer.renderReport(report);
}
