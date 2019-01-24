import * as _ from 'lodash';
import { VisioBox, VisioReport, BoxType, Position, VisioConnector } from './datatypes';
import { GraphSettings } from './graph-settings';

export class SvgRenderer {

    private static readonly BoxColors: Map<BoxType, string> = new Map([
        [BoxType.StationGroup, 'DarkGray '],
        [BoxType.Station, 'White'],
        [BoxType.Lot, 'DeepSkyBlue'],
        [BoxType.SampleNegative, 'DarkSeaGreen'],
        [BoxType.SampleConfirmed, 'IndianRed'],
        [BoxType.SampleProbable, 'Yellow']
    ]);

    static renderReport(report: VisioReport): string {
        let svg = '<svg ' +
        'height="' + report.graph.size.height + '" width="' + report.graph.size.width + '">';
        svg += this.renderDefs();
        svg += this.renderElements(report.graph.elements);
        svg += this.renderConnectors(report.graph.connectors, this.getPortPositions(report.graph.elements));
        svg += '</svg>';
        return svg;
    }

    private static getPortPositions(boxes: VisioBox[]): Map<string, Position> {
        const result: Map<string, Position> = new Map();
        for (const box of boxes) {
            for (const port of box.ports) {
                result.set(port.id, {
                    x: box.position.x + box.size.width * port.normalizedPosition.x,
                    y: box.position.y + box.size.height * port.normalizedPosition.y
                });
            }
            // result = new Map([...result, ...this.getPortPositions(box.elements)]); // ES6 notation
            this.getPortPositions(box.elements).forEach((value: Position, key: string) => {
                result.set(key, value);
            });
            // result = new Map([...Array.from(result.entries()), ...Array.from(this.getPortPositions(box.elements).entries())]);
        }
        return result;
    }
    static renderDefs(): string {
        return '  <style>\n' +
        '    .normalText { font: 8px arial; }\n' +
        // .heavy { font: bold 30px sans-serif; }

        /* Note that the color of the text is set with the    *
        * fill property, the color property is for HTML only */
        // .Rrrrr { font: italic 40px serif; fill: red; }
        '  </style>\n' +
        '  <defs>\n' +
        '    <!-- arrowhead marker definition -->\n' +
        '    <marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" \n' +
        '      markerWidth="6" markerHeight="6" \n' +
        '      orient="auto-start-reverse">\n' +
        '      <path d="M 0 0 L 10 5 L 0 10 z" />\n' +
        '    </marker>\n' +
        '  </defs>\n';
    }

    static renderElements(boxes: VisioBox[]): string {
        let svg = '';
        for (const box of boxes) {
            /*if ((box as NonConvexVisioContainer).shape !== undefined) {
                svg += this.renderNonConvexBox(box as NonConvexVisioContainer);
            } else {
                svg += this.renderSimpleBox(box);
            }*/
            svg += this.renderBox(box);
        }
        return svg;
    }

    static renderBox(box: VisioBox): string {
        let svg = '<g>';
        if (box.shape !== null) {
            svg += this.renderCustomBoxShape(box);
        } else {
            svg += this.renderSimpleBoxShape(box);
        }
        svg += this.renderLabel(box);
        svg += this.renderElements(box.elements);
        svg += '</g>';
        return svg;
    }

    static renderCustomBoxShape(box: VisioBox): string {
        const svg = '<polygon points="' +
        _.tail(box.shape.outerBoundary).map(p => (box.position.x + p.x) + ', ' + (box.position.y + p.y)).join(' ') + '" ' +
        'style="stroke:black; fill:' + this.BoxColors.get(box.type) + '; stroke-width: ' + GraphSettings.BORDER_WITH + ';opacity:0.5"/>';
        return svg;
    }

    static renderSimpleBoxShape(box: VisioBox): string {
        return '<rect x="' + box.position.x + '" y="' + box.position.y + '" ' +
        'rx="' + GraphSettings.RADIUS + '" ry="' + GraphSettings.RADIUS + '" ' +
        'width="' + box.size.width + '" height="' + box.size.height + '" ' +
        'style="fill:' + this.BoxColors.get(box.type) + ';stroke:black;stroke-width:' + GraphSettings.BORDER_WITH + ';opacity:1" />';
    }

    static renderLabel(box: VisioBox): string {
        const label = box.label;
        const centerAlign = box.type !== BoxType.StationGroup;
        const pos: Position = {
            x: label.relPosition.x + box.position.x + (centerAlign ? label.size.width / 2 : 0),
            y: label.relPosition.y + box.position.y
        };
        let svg = '<text alignment-baseline="top" ' +
        'text-anchor="' + (centerAlign ? 'middle' : 'start') + '" ' +
        'x="' + pos.x + '" ' +
        'y="' + pos.y + '" class="normalText">';
        const dy = 10;
        for (const text of label.text) {
            svg += '<tspan class="normalText" x="' + pos.x + '" dy="' + dy + '">' + text + '</tspan>';
            // svg += '<tspan class="normalText">' + text + '</tspan>';
            // dy += 10;
        }
        return svg + '</text>';
    }

    static renderConnectors(connectors: VisioConnector[], portPositions: Map<string, Position>): string {
        let svg = '';
        for (const connector of connectors) {
            const fromPos = portPositions.get(connector.fromPort);
            const toPos = portPositions.get(connector.toPort);
            svg += '<line ' +
            'x1="' + fromPos.x + '" ' +
            'y1="' + fromPos.y + '" ' +
            'x2="' + toPos.x + '" ' +
            'y2="' + toPos.y + '" ' +
            'stroke="black" marker-end="url(#arrow)" />\n';
        }
        return svg;
    }
}
