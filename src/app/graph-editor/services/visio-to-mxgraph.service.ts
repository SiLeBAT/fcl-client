import { Injectable } from '@angular/core';
import {
    VisioReport,
    VisioGraph,
    VisioBox,
    VisioConnector,
    Size,
    VisioLabel,
    BoxType,
    VisioPort,
    Position,
    GraphLayer
} from '../../tracing/visio/layout-engine/datatypes';
import * as _ from 'lodash';

declare const mxConstants: any;

const enum FontFamily {
  ARIAL = 'Arial',
  DIALOG = 'Dialog',
  VERDANA = 'Verdana',
  TIMES_NEW_ROMAN = 'Times New Roman'
}

const enum ElementColor {
    LEGEND_ENTRY_BOX_STROKE_COLOR = 'black',
    LEGEND_STROKE_COLOR = 'black',
    LEGEND_COLOR = 'white',
    REGION_COLOR = 'lightgrey',
    STATION_COLOR = 'white',
    HEADER_COLOR = '#ffff99',
    LOT_COLOR = '#bbdefb',
    SAMPLE_NEGATIVE_COLOR = '#b3ffb3',
    SAMPLE_CONFIRMED_COLOR = '#ff6666',
    SAMPLE_PROBABLE_COLOR = '#ffb74d',
    LABEL_COLOR = 'black',
    CONNECTOR_COLOR = 'black'
}

const enum HorizontalAlignment {
    LEFT = 'left',
    CENTER = 'center',
    RIGHT = 'right'
}

const enum VerticalAlignment {
    TOP = 'top',
    MIDDLE = 'middle',
    BOTTOM = 'bottom'
}

const LEGEND_ENTRY_SIZE = { width: 30, height: 20 };
const LEGEND_ENTRY_DIST = { x: 10, y: 5 };
const LEGEND_ENTRY_TO_LABEL_DIST = 5;
const LEGEND_RADIUS_SCALE = 1.0 / 2.0;
const HEADER_TO_GRAPH_DISTANCE = 10;

type ConstantSize = (size: number) => string;

type ConstantValue = (value: string) => string;

interface Constants {
    LegendEntryBoxStrokeColor: string;
    LegendStrokeColor: string;
    LegendColor: string;
    HeaderColor: string;
    RegionColor: string;
    StationColor: string;
    LotColor: string;
    LabelColor: string;
    SampleNegativeColor: string;
    SampleConfirmedColor: string;
    SampleProbableColor: string;
    Rounded: string;
    FillColor: ConstantValue;
    StrokeColor: ConstantValue;
    StrokeOpacity: ConstantSize;
    StrokeWidth: ConstantSize;
    FillOpacity: ConstantSize;
    HAlign: (value: HorizontalAlignment) => string;
    VAlign: (value: VerticalAlignment) => string;
    HStyle: (x?: boolean) => string;
    Rotation: ConstantSize;
    FontColor: ConstantValue;
    FontSize: ConstantSize;
    FontFamily: ConstantValue;
    FontStyle: (opt: {bold?: boolean; italic?: boolean; underline?: boolean}) => string; // ConstantPropSelection;
    WhiteSpaceStyle: (wrap: boolean) => string;
    LineArcSize: ConstantSize;
    ExitX: ConstantSize;
    ExitY: ConstantSize;
    EntryX: ConstantSize;
    EntryY: ConstantSize;
    EndArrow: ConstantValue;
    ConnectorColor: ConstantValue;
}

const BoxStyles: Constants = {
    LegendEntryBoxStrokeColor: ElementColor.LEGEND_ENTRY_BOX_STROKE_COLOR,
    LegendStrokeColor: ElementColor.LEGEND_STROKE_COLOR,
    LegendColor: ElementColor.LEGEND_COLOR,
    HeaderColor: ElementColor.HEADER_COLOR,
    RegionColor: ElementColor.REGION_COLOR,
    StationColor: ElementColor.STATION_COLOR,
    LotColor: ElementColor.LOT_COLOR,
    SampleNegativeColor: ElementColor.SAMPLE_NEGATIVE_COLOR,
    SampleConfirmedColor: ElementColor.SAMPLE_CONFIRMED_COLOR,
    SampleProbableColor: ElementColor.SAMPLE_PROBABLE_COLOR,
    LabelColor: ElementColor.LABEL_COLOR,
    Rounded: 'rounded=1',
    FillColor: (color: string) => `${mxConstants.STYLE_FILLCOLOR}=${color}`,
    StrokeColor: (color: string) => `${mxConstants.STYLE_STROKECOLOR}=${color}`,
    StrokeOpacity: (size: number) => `${mxConstants.STYLE_STROKE_OPACITY}=${size}`,
    StrokeWidth: (width: number) => `${mxConstants.STYLE_STROKEWIDTH}=${width}`,
    FillOpacity: (size: number) => `${mxConstants.STYLE_FILL_OPACITY}=${size}`,
    FontColor: (color: string) => `${mxConstants.STYLE_FONTCOLOR}=${color}`,
    FontSize: (pixel: number) => `${mxConstants.STYLE_FONTSIZE}=${pixel}`,
    FontFamily: (fontFamily: string) => `${mxConstants.STYLE_FONTFAMILY}=${fontFamily}`,
    FontStyle: (opt: {bold?: boolean; italic?: boolean; underline?: boolean}) =>
        `${mxConstants.STYLE_FONTSTYLE}=${0 + (opt.bold ? 1 : 0) + (opt.italic ? 2 : 0) + (opt.underline ? 4 : 0)}`,
    WhiteSpaceStyle: (wrap: boolean) => `${mxConstants.STYLE_WHITE_SPACE}=${wrap ? 'wrap' : 'nowrap'}`,
    HAlign: (hAlign: HorizontalAlignment) => `${mxConstants.STYLE_ALIGN}=${hAlign}`,
    VAlign: (vAlign: VerticalAlignment) => `${mxConstants.STYLE_VERTICAL_ALIGN}=${vAlign}`,
    HStyle: (horizontal?: boolean) => `${mxConstants.STYLE_HORIZONTAL}=${horizontal === false ? 0 : 1}`,
    Rotation: (rotation: number) => `${mxConstants.STYLE_ROTATION}=${rotation}`,
    LineArcSize: (size: number) => `${mxConstants.STYLE_ARCSIZE}=${size}`,
    ExitX: (value: number) => `${mxConstants.STYLE_EXIT_X}=${value}`,
    ExitY: (value: number) => `${mxConstants.STYLE_EXIT_Y}=${value}`,
    EntryX: (value: number) => `${mxConstants.STYLE_ENTRY_X}=${value}`,
    EntryY: (value: number) => `${mxConstants.STYLE_ENTRY_Y}=${value}`,
    EndArrow: (arrowStyle: string) => `${mxConstants.STYLE_ENDARROW}=${arrowStyle}`,
    ConnectorColor: (color: string) => `${mxConstants.STYLE_STROKECOLOR}=${color}`
};

interface Box {
    cell: mxCell;
    visioBox: VisioBox;
}

interface BoxPort {
    box: Box;
    currentPort: VisioPort;
}
interface LegendEntryInfo {
    label: string;
    style: any;
    isEdge?: boolean;
}

function getStyle(...styles): string {
    return styles.filter(s => s !== null && s !== undefined).join(';');
}

function regionStyle(forLegend = false) {
    return getStyle(
        BoxStyles.FillColor(BoxStyles.RegionColor),
        (!forLegend ? BoxStyles.StrokeOpacity(0) : BoxStyles.StrokeColor(BoxStyles.LegendEntryBoxStrokeColor)),
        BoxStyles.Rounded,
        BoxStyles.LineArcSize(1 * (forLegend ? LEGEND_RADIUS_SCALE : 1.0))
    );
}

function legendStyle() {
    return getStyle(
        BoxStyles.Rounded,
        BoxStyles.LineArcSize(5),
        BoxStyles.FillColor(BoxStyles.LegendColor),
        BoxStyles.StrokeColor(BoxStyles.LegendStrokeColor),
        BoxStyles.StrokeWidth(2)
    );
}

function legendEntryStyle() {
    return getStyle(
        BoxStyles.StrokeOpacity(0),
        BoxStyles.FillOpacity(0)
    );
}

function stationStyle(forLegend = false) {
    return getStyle(
        BoxStyles.Rounded,
        BoxStyles.LineArcSize(5 * (forLegend ? LEGEND_RADIUS_SCALE : 1.0)),
        BoxStyles.FillColor(BoxStyles.StationColor),
        (!forLegend ? BoxStyles.StrokeOpacity(0) : BoxStyles.StrokeColor(BoxStyles.LegendEntryBoxStrokeColor))
    );
}

function lotStyle(forLegend = false) {
    return getStyle(
        BoxStyles.Rounded,
        BoxStyles.LineArcSize(3 * (forLegend ? LEGEND_RADIUS_SCALE : 1.0)),
        BoxStyles.FillColor(BoxStyles.LotColor),
        (!forLegend ? BoxStyles.StrokeOpacity(0) : BoxStyles.StrokeColor(BoxStyles.LegendEntryBoxStrokeColor))
    );
}

function sampleNegativeStyle(forLegend = false) {
    return getStyle(
        BoxStyles.Rounded,
        BoxStyles.FillColor(BoxStyles.SampleNegativeColor),
        (!forLegend ? BoxStyles.StrokeOpacity(0) : BoxStyles.StrokeColor(BoxStyles.LegendEntryBoxStrokeColor))
    );
}

function sampleConfirmedStyle(forLegend = false) {
    return getStyle(
        BoxStyles.Rounded,
        BoxStyles.FillColor(BoxStyles.SampleConfirmedColor),
        (!forLegend ? BoxStyles.StrokeOpacity(0) : BoxStyles.StrokeColor(BoxStyles.LegendEntryBoxStrokeColor))
    );
}

function sampleProbableStyle(forLegend = false) {
    return getStyle(
        BoxStyles.Rounded,
        BoxStyles.FillColor(BoxStyles.SampleProbableColor),
        (!forLegend ? BoxStyles.StrokeOpacity(0) : BoxStyles.StrokeColor(BoxStyles.LegendEntryBoxStrokeColor))
    );
}

function labelStyle(bold?: boolean) {
    return getStyle(
        BoxStyles.StrokeOpacity(0),
        BoxStyles.FillOpacity(0),
        BoxStyles.FontColor(BoxStyles.LabelColor),
        BoxStyles.FontFamily(FontFamily.VERDANA),
        BoxStyles.FontSize(8),
        BoxStyles.FontStyle({ bold: bold })
    );
}

function legendTitleStyle() {
    return getStyle(
        BoxStyles.StrokeOpacity(0),
        BoxStyles.FillOpacity(0),
        BoxStyles.FontColor(BoxStyles.LabelColor),
        BoxStyles.FontFamily(FontFamily.VERDANA),
        BoxStyles.FontSize(10),
        BoxStyles.FontStyle({ bold: true }),
        BoxStyles.HAlign(HorizontalAlignment.LEFT)
    );
}

function legendEntryLabelStyle() {
    return getStyle(
        BoxStyles.StrokeOpacity(0),
        BoxStyles.FillOpacity(0),
        BoxStyles.FontColor(BoxStyles.LabelColor),
        BoxStyles.FontFamily(FontFamily.VERDANA),
        BoxStyles.FontSize(8),
        BoxStyles.HAlign(HorizontalAlignment.LEFT),
        BoxStyles.VAlign(VerticalAlignment.MIDDLE)
    );
}

function connectorStyle(exitX: number = 0.5, exitY: number = 1, entryX: number = 0.5, entryY: number = 0) {
    return getStyle(
        BoxStyles.ExitX(exitX),
        BoxStyles.ExitY(exitY),
        BoxStyles.EntryX(entryX),
        BoxStyles.EntryY(entryY),
        BoxStyles.EndArrow(mxConstants.ARROW_OPEN),
        BoxStyles.FillColor(BoxStyles.LabelColor),
        BoxStyles.ConnectorColor(ElementColor.CONNECTOR_COLOR)
    );
}

function headerStyle() {
    return getStyle(
        BoxStyles.Rounded,
        BoxStyles.LineArcSize(5),
        BoxStyles.FillColor(BoxStyles.HeaderColor),
        BoxStyles.HStyle(false),
        BoxStyles.FontColor(BoxStyles.LabelColor),
        BoxStyles.FontFamily(FontFamily.VERDANA),
        BoxStyles.FontSize(8),
        BoxStyles.FontStyle({ bold: true }),
        BoxStyles.WhiteSpaceStyle(true)
    );
}

function headerTextStyle() {
    return getStyle(
        BoxStyles.StrokeOpacity(0),
        BoxStyles.FillOpacity(0),
        BoxStyles.FontColor(BoxStyles.LabelColor),
        BoxStyles.FontFamily(FontFamily.VERDANA),
        BoxStyles.FontSize(8),
        BoxStyles.HAlign(HorizontalAlignment.CENTER),
        BoxStyles.VAlign(VerticalAlignment.MIDDLE),
        BoxStyles.Rotation(270),
        BoxStyles.FontStyle({ bold: true })
    );
}

const BoxTypeToLegendEntryInfo: { [key: string]: LegendEntryInfo } = {
    [BoxType.StationGroup]: {
        label: 'State',
        style: regionStyle(true)
    },
    [BoxType.Station]: {
        label: 'Establishment/ FBO/ station',
        style: stationStyle(true)
    },
    [BoxType.Lot]: {
        label: 'Food /feed product',
        style: lotStyle(true)
    },
    [BoxType.SampleNegative]: {
        label: 'Analytical results negative',
        style: sampleNegativeStyle(true)
    },
    [BoxType.SampleConfirmed]: {
        label: 'Analytical results positive',
        style: sampleConfirmedStyle(true)
    },
    [BoxType.SampleProbable]: {
        label: 'Analytical results ambiguous',
        style: sampleProbableStyle(true)
    }
};

@Injectable({
    providedIn: 'root'
})
export class VisioToMxGraphService {
    private graph: mxGraph;
    private boxes: Box[] = [];

    createGraph(report: VisioReport) {

        this.graph = new mxGraph(null);
        const parent: mxCell = this.graph.getDefaultParent();

        const visioGraph: VisioGraph = report.graph;
        const rootElements: VisioBox[] = visioGraph.elements;
        const connectors: VisioConnector[] = visioGraph.connectors;
        const graphSize: Size = visioGraph.size;

        this.graph.getModel().beginUpdate();

        const offset = { x: report.headerWidth + HEADER_TO_GRAPH_DISTANCE, y: 0 };

        // draw grouping elements
        rootElements.forEach((stationGroupBox) => {
            const stationGroupCell = this.drawVisioElement(parent, stationGroupBox, offset);

            // draw station and environmental smaple elements
            const stationBoxes: VisioBox[] = stationGroupBox.elements;
            stationBoxes.forEach((stationBox) => {
                const stationCell = this.drawVisioElement(stationGroupCell, stationBox);

                // draw lot elements
                const lotBoxes: VisioBox[] = stationBox.elements;
                lotBoxes.forEach((lotBox) => {
                    const lotCell = this.drawVisioElement(stationCell, lotBox);

                    // draw sample element
                    const sampleBoxes: VisioBox[] = lotBox.elements;
                    sampleBoxes.forEach((sampleBox) => {
                        const sampleCell = this.drawVisioElement(lotCell, sampleBox);
                    });
                });
            });
        });

        const id2BoxPort: Record<string, BoxPort> = {};
        this.boxes.forEach(
            box => box.visioBox.ports.forEach(port =>
                id2BoxPort[port.id] = { box: box, currentPort: port}
            )
        );

        // draw connectors
        connectors.forEach((connector: VisioConnector) => {
            const fromBoxPort = id2BoxPort[connector.fromPort];
            const toBoxPort = id2BoxPort[connector.toPort];
            this.drawEdge(parent, fromBoxPort, toBoxPort);
        });

        this.drawHeader(parent, report);
        const legendCell = this.drawLegend(parent, report, { x: 0, y: report.graph.size.height + 10 });

        if (legendCell) {
            this.drawFclImage(parent, { x: 0, y: this.getLowerBound(legendCell.getGeometry()) + 5 });
        }

        return this.graph;
    }

    private getLowerBound(geometry: mxGeometry): number {
        return geometry.y + geometry.height;
    }

    private drawFclImage(parent: mxCell, position: Position): mxCell {
        return this.graph.insertVertex(
            parent,
            null,
            '',
            position.x, position.y, 220, 20,
            'shape=image;image=' + '../../assets/CreatedWithFCL_Banner.svg',
            false);
    }

    private drawHeader(parent: mxCell, report: VisioReport): Position | Size {
        let height = 0.0;
        for (const layer of report.graphLayers) {
            this.drawLayerHeader(parent, layer, { x: 0, y: height }, report.headerWidth);
            height += layer.height;
        }
        return { x: 0, y: 0, width: report.headerWidth, height: height };
    }

    private drawLayerHeader(parent: mxCell, layer: GraphLayer, fromPos: Position, width: number) {
        const headerBoxStyle = headerStyle();
        const boxCell: mxCell = this.graph.insertVertex(
            parent,
            null,
            layer.activities.join('\n'),
            fromPos.x,
            fromPos.y,
            width,
            layer.height,
            headerBoxStyle,
            false
        );

        return boxCell;
    }

    private drawLegend(parent: mxCell, report: VisioReport, position: Position): mxCell | null {
        const legendEntries = this.getLegendEntries(report);
        const showDeliveries = report.graph.connectors.length > 0;

        const nEntries = Object.keys(legendEntries).filter(key => legendEntries[key]).length + (showDeliveries ? 1 : 0);
        if (!nEntries) {
            return null;
        }
        const legendCell: mxCell = this.drawLegendCell(parent, { x: position.x + 1, y: position.y + 0 });

        const titleCell: mxCell = this.drawLegendTitleCell(legendCell, { x: 5, y: 10 });

        const legendEntryInfos =
            [BoxType.StationGroup, BoxType.Station, BoxType.Lot, BoxType.SampleNegative, BoxType.SampleConfirmed, BoxType.SampleProbable]
                .filter(t => legendEntries[t]).map(t => BoxTypeToLegendEntryInfo[t]);
        if (showDeliveries) {
            legendEntryInfos.push({
                label: 'Deliveries',
                style: this.drawEdge,
                isEdge: true
            });
        }
        const legendEntryMatrix: LegendEntryInfo[][] = [];

        while (legendEntryInfos.length) {
            legendEntryMatrix.push(legendEntryInfos.splice(0, 2));
        }

        const startX = 10.0;
        const startY = 30.0;

        let xPos = startX;
        legendEntryMatrix.forEach((legendColumnEntries) => {
            const columnCells = legendColumnEntries.map((legendEntry, rowIndex) => this.drawLegendEntry(
                legendCell,
                legendEntry,
                { x: xPos, y: startY + rowIndex * (LEGEND_ENTRY_SIZE.height + LEGEND_ENTRY_DIST.y) }
            ));
            xPos += Math.max(...columnCells.map(c => c.getGeometry().width)) + LEGEND_ENTRY_DIST.x;
        });
        // add right margin (equal to leftMargin)
        const geometry = legendCell.getGeometry();
        geometry.width = geometry.width + startX;
        legendCell.setGeometry(geometry);

        return legendCell;
    }

    private drawLegendEntry(parent: mxCell, legendEntry: LegendEntryInfo, position: Position): mxCell {
        const entryCell = this.graph.insertVertex(
            parent,
            null,
            null,
            position.x,
            position.y,
            100,
            LEGEND_ENTRY_SIZE.height,
            legendEntryStyle(),
            false
        );
        if (!legendEntry.isEdge) {
            const boxCell: mxCell = this.graph.insertVertex(
                entryCell,
                null,
                null,
                0,
                0,
                LEGEND_ENTRY_SIZE.width,
                LEGEND_ENTRY_SIZE.height,
                legendEntry.style,
                false
            );
            const labelCell: mxCell = this.graph.insertVertex(
                entryCell,
                null,
                legendEntry.label,
                LEGEND_ENTRY_SIZE.width + LEGEND_ENTRY_TO_LABEL_DIST,
                0,
                50,
                LEGEND_ENTRY_SIZE.height,
                legendEntryLabelStyle(),
                false
            );
            const geo1 = labelCell.getGeometry();

            this.graph.updateCellSize(labelCell, false);
            const geo2 = labelCell.getGeometry();
        } else {

            const fromCell: mxCell = this.graph.insertVertex(
                entryCell,
                null,
                null,
                0,
                LEGEND_ENTRY_SIZE.height / 2,
                0,
                0,
                null,
                false
            );

            const toCell: mxCell = this.graph.insertVertex(
                entryCell,
                null,
                null,
                LEGEND_ENTRY_SIZE.width,
                LEGEND_ENTRY_SIZE.height / 2,
                0,
                0,
                null,
                false
            );

            const style = connectorStyle(
                0,
                0,
                0,
                0
            );

            const newEdge: mxCell = this.graph.insertEdge(
                entryCell,
                null,
                null,
                fromCell,
                toCell,
                style
            );

            const labelCell: mxCell = this.graph.insertVertex(
                entryCell,
                null,
                legendEntry.label,
                LEGEND_ENTRY_SIZE.width + LEGEND_ENTRY_TO_LABEL_DIST,
                0,
                50,
                LEGEND_ENTRY_SIZE.height,
                legendEntryLabelStyle(),
                false
            );
        }

        return entryCell;
    }

    private drawLegendCell(parent: mxCell, position: Position): mxCell {
        return this.graph.insertVertex(
            parent,
            null,
            null,
            position.x,
            position.y,
            200,
            100,
            legendStyle(),
            false
        );
    }

    private drawLegendTitleCell(parent: mxCell, position: Position): mxCell {
        return this.graph.insertVertex(
            parent,
            null,
            'Legend',
            position.x,
            position.y,
            100,
            10,
            legendTitleStyle(),
            false
        );
    }

    private getLegendEntries(report: VisioReport): { [key: string]: boolean } {
        const legendEntries: { [key: string]: boolean } = {};

        const travElements = (visioBoxes: VisioBox[]) => {
            visioBoxes.forEach(visioBox => {
                legendEntries[visioBox.type] = true;
                if (visioBox.elements) {
                    travElements(visioBox.elements);
                }
            });
        };
        travElements(report.graph.elements);

        return legendEntries;
    }

    private drawVisioElement(currentParent: mxCell, visioBox: VisioBox, offset?: Position): mxCell {
        const newCell: mxCell = this.drawCell(currentParent, visioBox, offset);
        this.pushToBoxes(newCell, visioBox);
        visioBox.labels.forEach(label => this.drawLabel(newCell, label));

        return newCell;
    }

    private drawCell(parent: mxCell, box: VisioBox, offset?: Position): mxCell {
        let cellStyle: string = '';
        switch (box.type) {
            case BoxType.StationGroup:
                cellStyle = regionStyle();
                break;
            case BoxType.Station:
                cellStyle = stationStyle();
                break;
            case BoxType.Lot:
                cellStyle = lotStyle();
                break;
            case BoxType.SampleNegative:
                cellStyle = sampleNegativeStyle();
                break;
            case BoxType.SampleConfirmed:
                cellStyle = sampleConfirmedStyle();
                break;
            case BoxType.SampleProbable:
                cellStyle = sampleProbableStyle();
                break;
            default:
                cellStyle = '';
        }

        const newCell: mxCell = this.graph.insertVertex(
            parent,
            null,
            null,
            box.relPosition.x + (!offset ? 0 : offset.x),
            box.relPosition.y + (!offset ? 0 : offset.y),
            box.size.width,
            box.size.height,
            cellStyle,
            false
        );

        return newCell;
    }

    private drawLabel(parent: mxCell, label: VisioLabel) {
        const labelText: string = label.text.join('\n');
        const newLabel: mxCell = this.graph.insertVertex(
            parent,
            null,
            labelText,
            label.relPosition.x,
            label.relPosition.y,
            label.size.width,
            label.size.height,
            labelStyle(label.style?.bold),
            false
        );

        return newLabel;
    }

    private drawEdge(parent: mxCell, fromBox: BoxPort, toBox: BoxPort): mxCell {
        const style = connectorStyle(
            fromBox.currentPort.normalizedPosition.x,
            fromBox.currentPort.normalizedPosition.y,
            toBox.currentPort.normalizedPosition.x,
            toBox.currentPort.normalizedPosition.y
        );

        const newEdge: mxCell = this.graph.insertEdge(
            parent,
            null,
            null,
            fromBox.box.cell,
            toBox.box.cell,
            style
        );

        return newEdge;
    }

    private pushToBoxes(cell: mxCell, box: VisioBox) {
        const newBox: Box = {
            cell: cell,
            visioBox: box
        };
        this.boxes.push(newBox);

    }
}
