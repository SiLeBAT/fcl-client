import * as _ from 'lodash';
import { VisioBox, VisioReport, BoxType, Position, VisioConnector, Size } from './datatypes';
import { GraphSettings } from './graph-settings';

export class SvgRenderer {

    private static readonly BoxColors: Map<BoxType, string> = new Map([
        [BoxType.StationGroup, 'DarkGray '],
        [BoxType.Station, 'White'],
        [BoxType.Lot, 'DeepSkyBlue'],
        [BoxType.SampleNegative, 'DarkSeaGreen'],
        [BoxType.SampleConfirmed, 'IndianRed'],
        [BoxType.SampleProbable, 'Yellow'],
        [BoxType.SampleUnknown, 'Purple']
    ]);

    static renderReport(report: VisioReport): string {
        return '' +
        this.renderSvgHeader(report.graph.size) +
        this.renderDefs() +
        this.renderElements(this.getSortedBoxes(report.graph.elements)) +
        this.renderConnectors(report.graph.connectors, this.getPortPositions(report.graph.elements)) +
        '</svg>';
    }

    private static renderSvgHeader(size: Size): string {
        return '' +
        '<svg xmlns="http://www.w3.org/2000/svg" ' +
        'height="' + size.height + '" width="' + size.width + '">\n';
    }

    private static getSortedBoxes(boxes: VisioBox[]): VisioBox[] {
        // some groupes might be within other groups
        // so bigger groups have to be rendered first
        const result = boxes.slice();
        result.sort((b1, b2) => Math.min(b2.size.width - b1.size.width, b2.size.height - b1.size.height));
        return result;
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
            this.getPortPositions(box.elements).forEach((value: Position, key: string) => {
                result.set(key, value);
            });
        }
        return result;
    }

    private static renderDefs(): string {
        return '' +
        '  <style>\n' +
        '    .normalText { font: 8px arial; }\n' +
        '  </style>\n' +
        '  <defs>\n' +
        '    <!-- arrowhead marker definition -->\n' +
        '    <marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" \n' +
        '      markerWidth="6" markerHeight="6" \n' +
        '      orient="auto">\n' +
        '      <path d="M 0 0 L 10 5 L 0 10 z" />\n' +
        '    </marker>\n' +
        '  </defs>\n';
    }

    private static renderElements(boxes: VisioBox[]): string {
        return boxes.map(b => this.renderBox(b)).join('\n');
    }

    private static renderBox(box: VisioBox): string {
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

    private static renderCustomBoxShape(box: VisioBox): string {
        return this.renderPolygon(
            box.shape.outerBoundary.map(p => ({
                x: p.x + box.position.x,
                y: p.y + box.position.y
            })), this.BoxColors.get(box.type), '0.5'
            ) + box.shape.holes.map(
                h => this.renderPolygon(
                    h.map(p => ({
                        x: p.x + box.position.x,
                        y: p.y + box.position.y
                    })), 'white', '1'
                    )
                ).join('\n');
    }

    private static renderPolygon(polygon: Position[], color: string, opacity: string): string {
        return '<polygon points="' +
        _.tail(polygon).map(p => p.x + ', ' + p.y).join(' ') + '" ' +
        'style="stroke:black; fill:' + color + '; stroke-width: ' + GraphSettings.BORDER_WITH + ';opacity:' + opacity + '"/>';
    }

    private static renderSimpleBoxShape(box: VisioBox): string {
        return '' +
        '<rect x="' + box.position.x + '" y="' + box.position.y + '" ' +
        'rx="' + GraphSettings.RADIUS + '" ry="' + GraphSettings.RADIUS + '" ' +
        'width="' + box.size.width + '" height="' + box.size.height + '" ' +
        'style="fill:' + this.BoxColors.get(box.type) + ';stroke:black;stroke-width:' + GraphSettings.BORDER_WITH + ';opacity:1" />';
    }

    private static renderLabel(box: VisioBox): string {
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
        }
        return svg + '</text>';
    }

    private static renderConnectors(connectors: VisioConnector[], portPositions: Map<string, Position>): string {
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
