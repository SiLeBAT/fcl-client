import * as _ from 'lodash';
import { VisioReport, VisioBox, StationInformation, LotInformation, GraphLayer, FontMetrics,
    SampleInformation, BoxType, VisioLabel, Size, ReportType, StationGrouper } from './datatypes';
import { FclElements, Position } from './../../util/datatypes';
import { Utils } from './../../util/utils';
import { GraphSettings } from './graph-settings';
// import { FontMetrics } from './font-metrics';
import { BoxCreator } from './box-creator';
import { assignToGrid } from './grid-assigner';
import { LabelCreator } from './label-creator';
import { ConfidentialLabelCreator } from './confidential-label-creator';
import { PublicLabelCreator } from './public-label-creator';
import { InformationProvider } from './information-provider';
import { getCellGroups } from './cell-grouper';
import { CtNoAssigner } from './ctno-assigner';
import { ConnectorCreator } from './connector-creator';

export class VisioReporter {

    static createReport(data: FclElements, canvas: any, type: ReportType, stationGrouper: StationGrouper): VisioReport {
        const stationGrid = assignToGrid(data);
        const stationGroups = stationGrouper.groupStations([].concat(...stationGrid).filter(s => s !== null));
        const infoProvider = new InformationProvider(data);
        const cellGroups = getCellGroups(stationGrid, stationGroups);

        const labelCreator = this.getLabelCreator(type, this.getFontMetrics(canvas));
        const boxCreator = new BoxCreator(labelCreator);

        const infoGrid = this.mapMatrix(stationGrid, (s) => s !== null ? infoProvider.getStationInfo(s) : null);
        CtNoAssigner.assingCtNos(infoGrid);
        const boxGrid = this.mapMatrix(infoGrid, (info) => info !== null ? boxCreator.getStationBox(info) : null);

        const layerInfo: GraphLayer[] = this.getLayerInformation(infoGrid);

        const groupBoxes = boxCreator.getGroupBoxes(boxGrid, cellGroups, layerInfo);
        const connectors = new ConnectorCreator(boxCreator, infoProvider).createConnectors();

        this.setAbsolutePositions(groupBoxes, { x: 0, y: 0 });
        boxCreator.resortLotBoxes(connectors);

        const result: VisioReport = {
            graph: {
                elements: groupBoxes,
                connectors: connectors,
                size: this.getSize(groupBoxes)
            },
            graphLayers: layerInfo
        };

        return result;
    }

    private static getSize(boxes: VisioBox[]): Size {
        return {
            width: Math.max(...boxes.map(b => b.position.x + b.size.width)) -
            Math.min(...boxes.map(b => b.position.x)) + 2 * GraphSettings.GRID_MARGIN,
            height: Math.max(...boxes.map(b => b.position.y + b.size.height)) -
            Math.min(...boxes.map(b => b.position.y)) + 2 * GraphSettings.GRID_MARGIN
        };
    }

    private static getFontMetrics(canvas: any): FontMetrics {
        return {
            measureTextWidth: (text: string[]) => 80,
            measureText: (text: string[]) => ({
                width: Math.max(...text.map(t => t.length)) * 4,
                height: 10 * text.length
            })
        };

        // return new FontMetrics(canvas);
    }

    private static getLabelCreator(type: ReportType, fontMetrics: FontMetrics): LabelCreator {
        if (type === ReportType.Confidential) {
            return new ConfidentialLabelCreator(fontMetrics);
        } else {
            return new PublicLabelCreator(fontMetrics);
        }
    }

    private static mapMatrix<A, B>(matrix: A[][], fn: (a: A) => B): B[][] {
        return matrix.map(array => array.map(element => fn(element)));
    }

    private static getLayerInformation(infoGrid: StationInformation[][]): GraphLayer[] {
        return infoGrid.map(
            layer => ({
                activities: _.uniq(layer.map(info => info !== null ? info.activities : null).filter(t => t !== null)),
                height: null
            }));
    }

    private static setAbsolutePositions(boxes: VisioBox[], refPos: Position) {
        for (const box of boxes) {
            box.position = {
                x: refPos.x + box.relPosition.x,
                y: refPos.y + box.relPosition.y
            };
            this.setAbsolutePositions(box.elements, box.position);
        }
    }
}
