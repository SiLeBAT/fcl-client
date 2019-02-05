import { Injectable } from '@angular/core';
import {
  VisioReport,
  VisioGraph,
  VisioBox,
  VisioConnector,
  Size,
  VisioLabel,
  BoxType,
  VisioPort
} from '../../visio/layout-engine/datatypes';
import * as _ from 'lodash';
import { _MatFormFieldMixinBase } from '@angular/material';

declare const mxConstants: any;

const enum FontFamily {
  ARIAL = 'Arial',
  DIALOG = 'Dialog',
  VERDANA = 'Verdana',
  TIMES_NEW_ROMAN = 'Times New Roman'
}

const enum ElementColor {
  REGION_COLOR = 'lightgrey',
  STATION_COLOR = 'white',
  LOT_COLOR = '#bbdefb',
  SAMPLE_COLOR = '#ff6666',
  LABEL_COLOR = 'black',
  CONNECTOR_COLOR = 'black'
}

type ConstantSize = (size: number) => string;

type ConstantValue = (value: string) => string;

interface Constants {
    RegionColor: string;
    StationColor: string;
    LotColor: string;
    LabelColor: string;
    SampleColor: string;
    Rounded: string;
    FillColor: ConstantValue;
    StrokeOpacity: ConstantSize;
    FillOpacity: ConstantSize;
    FontColor: ConstantValue;
    FontSize: ConstantSize;
    FontFamily: ConstantValue;
    LineArcSize: ConstantSize;
    ExitX: ConstantSize;
    ExitY: ConstantSize;
    EntryX: ConstantSize;
    EntryY: ConstantSize;
    EndArrow: ConstantValue;
    ConnectorColor: ConstantValue;
}

const BoxStyles: Constants = {
    RegionColor: ElementColor.REGION_COLOR,
    StationColor: ElementColor.STATION_COLOR,
    LotColor: ElementColor.LOT_COLOR,
    SampleColor: ElementColor.SAMPLE_COLOR,
    LabelColor: ElementColor.LABEL_COLOR,
    Rounded: 'rounded=1',
    FillColor: (color: string) => `${mxConstants.STYLE_FILLCOLOR}=${color}`,
    StrokeOpacity: (size: number) => `${mxConstants.STYLE_STROKE_OPACITY}=${size}`,
    FillOpacity: (size: number) => `${mxConstants.STYLE_FILL_OPACITY}=${size}`,
    FontColor: (color: string) => `${mxConstants.STYLE_FONTCOLOR}=${color}`,
    FontSize: (pixel: number) => `${mxConstants.STYLE_FONTSIZE}=${pixel}`,
    FontFamily: (fontFamily: string) => `${mxConstants.STYLE_FONTFAMILY}=${fontFamily}`,
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

        // draw grouping elements
        _.forIn(rootElements, (stationGroup: VisioBox) => {
            const stationGroupCell = this.drawVisioElement(parent, stationGroup);

            // draw station elements
            const stationElements: VisioBox[] = stationGroup.elements;
            _.forIn(stationElements, (station: VisioBox) => {
                const stationCell = this.drawVisioElement(stationGroupCell, station);

                // draw lot elements
                const lotElements: VisioBox[] = station.elements;
                _.forIn(lotElements, (lot: VisioBox) => {
                    const lotCell = this.drawVisioElement(stationCell, lot);
                });
            });
        });

        // draw connectors
        _.forIn(connectors, (connector: VisioConnector) => {
            const fromBoxPort: BoxPort = this.getMatchingBoxPort(connector.fromPort);
            const toBoxPort: BoxPort = this.getMatchingBoxPort(connector.toPort);
            const edge: mxCell = this.drawEdge(parent, fromBoxPort, toBoxPort);
        });

        return this.graph;
    }

    private drawVisioElement(currentParent: mxCell, visioBox: VisioBox): mxCell {
        const newCell: mxCell = this.drawCell(currentParent, visioBox);
        this.pushToBoxes(newCell, visioBox);
        if (visioBox.label) {
            const newLabel: mxCell = this.drawLabel(newCell, visioBox.label);
        }

        return newCell;
    }

    private drawCell(parent: mxCell, box: VisioBox): mxCell {
        let labelStyle: string = '';
        switch (box.type) {
            case BoxType.StationGroup:
                labelStyle = this.regionStyle();
                break;
            case BoxType.Station:
                labelStyle = this.stationStyle();
                break;
            case BoxType.Lot:
                labelStyle = this.lotStyle();
                break;
            default:
                labelStyle = '';
        }

        const newCell: mxCell = this.graph.insertVertex(
          parent,
          null,
          null,
          box.relPosition.x,
          box.relPosition.y,
          box.size.width,
          box.size.height,
          labelStyle,
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
            this.labelStyle(),
            false
        );

        return newLabel;
    }

    private drawEdge(parent: mxCell, fromBox: BoxPort, toBox: BoxPort): mxCell {
        const style = this.connectorStyle(
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

    private getMatchingBoxPort(portId: string): BoxPort {
        const boxPort: BoxPort = _.reduce(this.boxes, (result: BoxPort, box: Box) => {
            _.forIn(box.visioBox.ports, (currentPort: VisioPort) => {
                if (currentPort.id === portId) {
                    result = {
                        box: box,
                        currentPort: currentPort
                    };
                }
            });
            return result;
        }, null);

        return boxPort;
    }

    private getStyle(...styles): string {
        return styles.join(';');
    }

    private regionStyle() {
        return this.getStyle(
          BoxStyles.FillColor(BoxStyles.RegionColor),
          BoxStyles.StrokeOpacity(0),
          BoxStyles.Rounded,
          BoxStyles.LineArcSize(1)
        );
    }

    private stationStyle() {
        return this.getStyle(
          BoxStyles.Rounded,
          BoxStyles.LineArcSize(5),
          BoxStyles.FillColor(BoxStyles.StationColor),
          BoxStyles.StrokeOpacity(0)
        );
    }

    private lotStyle() {
        return this.getStyle(
          BoxStyles.Rounded,
          BoxStyles.LineArcSize(3),
          BoxStyles.FillColor(BoxStyles.LotColor),
          BoxStyles.StrokeOpacity(0)
        );
    }

    private sampleStyle() {
        return this.getStyle(
          BoxStyles.Rounded,
          BoxStyles.FillColor(BoxStyles.SampleColor),
          BoxStyles.StrokeOpacity(0)
        );
    }

    private labelStyle() {
        return this.getStyle(
          BoxStyles.StrokeOpacity(0),
          BoxStyles.FillOpacity(0),
          BoxStyles.FontColor(BoxStyles.LabelColor),
          BoxStyles.FontFamily(FontFamily.VERDANA),
          BoxStyles.FontSize(8)
        );
    }

    private connectorStyle(exitX: number = 0.5, exitY: number = 1, entryX: number = 0.5, entryY: number = 0) {
        return this.getStyle(
          BoxStyles.ExitX(exitX),
          BoxStyles.ExitY(exitY),
          BoxStyles.EntryX(entryX),
          BoxStyles.EntryY(entryY),
          BoxStyles.EndArrow(mxConstants.ARROW_OPEN),
          BoxStyles.FillColor(BoxStyles.LabelColor),
          BoxStyles.ConnectorColor(ElementColor.CONNECTOR_COLOR)
        );
    }

}
