import * as _ from 'lodash';
import {
    VisioReport, VisioBox, StationInformation, GraphLayer, FontMetrics,
    Size, StationGrouper} from './datatypes';
import { Position, StationData, DeliveryData, SampleData, StationId } from '../../data.model';
import { GraphSettings } from './graph-settings';
import { BoxCreator } from './box-creator';
import { assignToGrid } from './grid-assigner';
import { InformationProvider } from './information-provider';
import { getCellGroups } from './cell-grouper';
import { CtNoAssigner } from './ctno-assigner';
import { ConnectorCreator } from './connector-creator';
import { improvePositions } from './station_positioner_lp';
import { groupStationBoxes } from './stationbox-simple-grouper';
import { CustomLabelCreator } from './custom-label-creator';
import { ROASettings } from '../model';

interface FclElements {
    stations: StationData[];
    deliveries: DeliveryData[];
    samples: SampleData[];
}

export class VisioReporter {

    static createReport(
        data: FclElements,
        statIdToPosMap: Record<StationId, Position>,
        canvas: any,
        roaSettings: ROASettings,
        stationGrouper: StationGrouper
    ): VisioReport {

        const stationGrid = assignToGrid(data, statIdToPosMap);
        const stationGroups = stationGrouper.groupStations([].concat(...stationGrid).filter(s => s !== null));
        const infoProvider = new InformationProvider(data, roaSettings);
        const cellGroups = getCellGroups(stationGrid, stationGroups);

        const labelCreator = new CustomLabelCreator(this.getFontMetrics(canvas), roaSettings.labelSettings, roaSettings.roundNumbers);
        const boxCreator = new BoxCreator(labelCreator, infoProvider);

        const infoGrid = this.mapMatrix(stationGrid, (s) => s !== null ? infoProvider.getStationInfo(s) : null);
        CtNoAssigner.assingCtNos(infoGrid);
        const boxGrid = this.mapMatrix(infoGrid, (info) => info !== null ? boxCreator.createStationBox(info) : null);

        const layerInfo: GraphLayer[] = this.getLayerInformation(infoGrid);

        let groupBoxes = boxCreator.createGroupBoxes(boxGrid, cellGroups, layerInfo);
        const connectors = new ConnectorCreator(boxCreator, infoProvider).createConnectors();

        this.setAbsolutePositions(groupBoxes, { x: 0, y: 0 });
        boxCreator.resortLotBoxes(connectors);

        const stationBoxGroups = stationGroups.map(sg => ({
            'label': sg.label,
            'boxes': sg.stations.map(s => boxCreator.getStationBox(infoProvider.getStationInfo(s)))
        }));
        improvePositions(
            boxGrid.map(row => row.filter(b => b != null)),
            stationBoxGroups,
            connectors,
            2 * GraphSettings.GRID_MARGIN,
            2 * (GraphSettings.GRID_MARGIN + GraphSettings.GROUP_MARGIN)
        );

        groupBoxes = groupStationBoxes(stationBoxGroups, labelCreator);
        this.setAbsolutePositions(groupBoxes, { x: 0, y: 0 });

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
        const measureTextWidth = (text: string[]) => Math.max(1, ...text.map(t => t.length)) * 4.4;
        return {
            measureTextWidth: measureTextWidth,
            measureText: (text: string[]) => ({
                width: measureTextWidth(text),
                height: 10 * text.length
            })
        };
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
