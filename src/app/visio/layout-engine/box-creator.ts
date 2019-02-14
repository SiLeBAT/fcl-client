import * as _ from 'lodash';
import { VisioBox, StationInformation, LotInformation, GraphLayer, GridCell,
    SampleInformation, BoxType, VisioLabel, Size, SampleResultType, VisioConnector, VisioPort } from './datatypes';
import { Position } from './../../util/datatypes';
import { GraphSettings } from './graph-settings';
import { LabelCreator } from './label-creator';
import { GroupContainerCreator } from './group-container-creator';
import { LotBoxSorter } from './lotbox_sorter';

export class BoxCreator {

    private stationIdToBoxMap: Map<string, VisioBox>;
    private lotIdToBoxMap: Map<string, VisioBox>;
    private stationLots: Map<VisioBox, VisioBox[]>;
    private portToBox: Map<VisioPort, VisioBox>;
    private portCounter: number = 0;

    private static getSampleType(sampleInfo: SampleInformation): BoxType {
        switch (sampleInfo.resultType) {
            case SampleResultType.Confirmed:
                return BoxType.SampleConfirmed;
            case SampleResultType.Negative:
                return BoxType.SampleNegative;
            default:
                return BoxType.SampleProbable;
        }
    }

    private static getRight(object: {relPosition: Position, size: Size}): number {
        return object.relPosition.x + object.size.width;
    }

    private static getBottom(object: {relPosition: Position, size: Size}): number {
        return object.relPosition.y + object.size.height;
    }

    private static vAlign(boxes: VisioBox[], start: Position, distance: number): Size {
        if (boxes.length > 0) {

            boxes[0].relPosition = Object.assign({}, start);

            for (let i = 1, n = boxes.length; i < n; i++) {
                boxes[i].relPosition = {
                    x: boxes[0].relPosition.x,
                    y: BoxCreator.getBottom(boxes[i - 1]) + distance
                };
            }

            return {
                width: Math.max(...boxes.map(b => b.size.width)),
                height: BoxCreator.getBottom(boxes[boxes.length - 1]) - start.y
            };

        } else {
            return {
                width: 0,
                height: 0
            };
        }
    }

    private static hAlign(boxes: VisioBox[], start: Position, distance: number): Size {
        if (boxes.length > 0) {

            boxes[0].relPosition = Object.assign({}, start);

            for (let i = 1, n = boxes.length; i < n; i++) {
                boxes[i].relPosition = {
                    x: BoxCreator.getRight(boxes[i - 1]) + distance,
                    y: boxes[0].relPosition.y
                };
            }

            return {
                width: BoxCreator.getRight(boxes[boxes.length - 1]) - start.x,
                height: Math.max(...boxes.map(b => b.size.height))
            };

        } else {
            return {
                width: 0,
                height: 0
            };
        }
    }

    private static getSize(boxes: {relPosition: Position; size: Size}[], margin: number): Size {
        margin *= 2;

        if (boxes.length === 0) {

            return { width: margin, height: margin };

        } else {

            const minX = Math.min(...boxes.map(b => b.relPosition.x));
            const minY = Math.min(...boxes.map(b => b.relPosition.y));
            const maxX = Math.max(...boxes.map(b => BoxCreator.getRight(b)));
            const maxY = Math.max(...boxes.map(b => BoxCreator.getBottom(b)));

            return { width: maxX - minX + margin, height: maxY - minY + margin };
        }
    }

    private static move(boxes: VisioBox[], move: Position) {
        boxes.forEach(b => {
            b.relPosition.x += move.x;
            b.relPosition.y += move.y;
        });
    }

    constructor(private labelCreator: LabelCreator) {
        this.stationIdToBoxMap = new Map();
        this.lotIdToBoxMap = new Map();
        this.stationLots = new Map();
        this.portToBox = new Map();
    }

    getLotBox(lotInfo: LotInformation): VisioBox {
        if (!this.lotIdToBoxMap.has(lotInfo.id)) {
            const label: VisioLabel = this.labelCreator.getLotLabel(lotInfo);

            const sampleBoxes: VisioBox[] = lotInfo.samples.map(s => this.getLotSampleBox(s));
            const sampleAreaStart: Position = {
                x: GraphSettings.LOT_BOX_MARGIN,
                y: BoxCreator.getBottom(label) + GraphSettings.SECTION_DISTANCE
            };
            BoxCreator.vAlign(sampleBoxes, sampleAreaStart, GraphSettings.SAMPLE_BOX_DISTANCE);

            const lotBox = {
                type: BoxType.Lot,
                label: label,
                size: BoxCreator.getSize([].concat([label], sampleBoxes), GraphSettings.LOT_BOX_MARGIN),
                position: null,
                relPosition: null,
                ports: [{
                    id: 'p' + this.portCounter++,
                    normalizedPosition: {
                        x: 0.5,
                        y: 1
                    }
                }],
                elements: sampleBoxes,
                shape: null
            };
            this.lotIdToBoxMap.set(lotInfo.id, lotBox);
            lotBox.ports.forEach(p => {
                this.portToBox.set(p, lotBox);
            });
        }
        return this.lotIdToBoxMap.get(lotInfo.id);
    }

    getStationBox(stationInfo: StationInformation): VisioBox {
        if (!this.stationIdToBoxMap.has(stationInfo.id)) {
            const label: VisioLabel = this.labelCreator.getStationLabel(stationInfo);

            const lotBoxes: VisioBox[] = [].concat(...stationInfo.products.map(p => p.lots.map(lot => this.getLotBox(lot))));

            const lotAreaStart: Position = {
                x: GraphSettings.STATION_BOX_MARGIN,
                y: BoxCreator.getBottom(label) + GraphSettings.SECTION_DISTANCE
            };
            BoxCreator.hAlign(lotBoxes, lotAreaStart, GraphSettings.LOT_BOX_DISTANCE);

            const stationBox = {
                type: BoxType.Station,
                label: label,
                size: BoxCreator.getSize([].concat([label], lotBoxes), GraphSettings.STATION_BOX_MARGIN),
                position: null,
                relPosition: null,
                ports: [{
                    id: 'p' + this.portCounter++,
                    normalizedPosition: {
                        x: 0.5,
                        y: 0
                    }
                }],
                elements: lotBoxes,
                shape: null
            };

            // center align label
            label.relPosition.x = (stationBox.size.width - label.size.width) / 2;
            if (lotBoxes.length > 0) {
                // center align lots
                const deltaX = (stationBox.size.width - 2 * GraphSettings.STATION_BOX_MARGIN -
                    (BoxCreator.getRight(_.last(lotBoxes)) - lotAreaStart.x)) / 2;
                lotBoxes.forEach(box => box.relPosition.x += deltaX);
            }

            this.stationIdToBoxMap.set(stationInfo.id, stationBox);
            stationBox.ports.forEach(p => {
                this.portToBox.set(p, stationBox);
            });
            this.stationLots.set(stationBox, lotBoxes);
        }

        return this.stationIdToBoxMap.get(stationInfo.id);
    }

    getLotSampleBox(sampleInfo: SampleInformation): VisioBox {
        const label: VisioLabel = this.labelCreator.getLotSampleLabel(sampleInfo);

        return {
            type: BoxCreator.getSampleType(sampleInfo),
            position: null,
            relPosition: null,
            ports: [],
            size: {
                width: label.size.width + 2 * GraphSettings.SAMPLE_BOX_MARGIN,
                height: label.size.height + 2 * GraphSettings.SAMPLE_BOX_MARGIN
            },
            label: label,
            elements: [],
            shape: null
        };
    }

    getGroupBoxes(
        boxGrid: VisioBox[][],
        cellGroups: { label: string, cells: GridCell[] }[],
        graphLayers: GraphLayer[]
        ): VisioBox[] {

        const groupCreator = new GroupContainerCreator();
        return groupCreator.createGroupBoxes(
            boxGrid,
            cellGroups.map(g => ({ label: this.labelCreator.getLabel([g.label], null), cells: g.cells })),
            graphLayers
            );
    }

    resortLotBoxes(connectors: VisioConnector[]) {
        const lotBoxSorter = new LotBoxSorter(this.portToBox, connectors);
        this.stationLots.forEach((lots, station) => {
            if (lots.length > 1) {
                const startPosition = lots[0].relPosition;
                lotBoxSorter.sortLotBoxes(lots);
                BoxCreator.hAlign(lots, startPosition, GraphSettings.LOT_BOX_DISTANCE);
                lots.forEach(
                    lot => {
                        lot.position = {
                            x: station.position.x + lot.relPosition.x,
                            y: station.position.y + lot.relPosition.y
                        };
                    });
            }
        });
    }
}
