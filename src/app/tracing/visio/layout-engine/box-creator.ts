import {
  VisioBox,
  StationInformation,
  LotInformation,
  GraphLayer,
  GridCell,
  StationSampleInformation,
  SampleInformation,
  BoxType,
  Size,
  VisioConnector,
  VisioPort,
  InSampleInformation,
} from './datatypes';
import {Position, SampleResultType} from '../../data.model';
import {GraphSettings} from './graph-settings';
import {LabelCreator} from './label-creator';
import {GroupContainerCreator} from './group-container-creator';
import {LotBoxSorter} from './lotbox_sorter';
import {InformationProvider} from './information-provider';
import {isArray} from 'lodash';
import {concat} from '@app/tracing/util/non-ui-utils';

interface IWithSizeAdRelPos {
  relPosition: Position;
  size: Size;
}

export class BoxCreator {
  private stationIdToBoxMap: Map<string, VisioBox>;
  private lotIdToBoxMap: Map<string, VisioBox>;
  private stationLots: Map<VisioBox, VisioBox[]>;
  private portToBox: Map<VisioPort, VisioBox>;
  private portCounter = 0;

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

  private static getRight(object: {relPosition: Position; size: Size}): number {
    return object.relPosition.x + object.size.width;
  }

  private static getBottom<T extends {relPosition: Position; size: Size}>(
    arrOrObj: T | T[]
  ): number {
    if (isArray(arrOrObj)) {
      return Math.max(...arrOrObj.map(o => BoxCreator.getBottom(o)));
    } else {
      return arrOrObj.relPosition.y + arrOrObj.size.height;
    }
  }

  private static vAlign(
    boxes: VisioBox[],
    start: Position,
    distance: number
  ): Size {
    if (boxes.length > 0) {
      boxes[0].relPosition = Object.assign({}, start);

      for (let i = 1, n = boxes.length; i < n; i++) {
        boxes[i].relPosition = {
          x: boxes[0].relPosition.x,
          y: BoxCreator.getBottom(boxes[i - 1]) + distance,
        };
      }

      return {
        width: Math.max(...boxes.map(b => b.size.width)),
        height: BoxCreator.getBottom(boxes[boxes.length - 1]) - start.y,
      };
    } else {
      return {
        width: 0,
        height: 0,
      };
    }
  }

  private static hAlign(
    boxes: VisioBox[],
    start: Position,
    distance: number
  ): Size {
    if (boxes.length > 0) {
      boxes[0].relPosition = Object.assign({}, start);

      for (let i = 1, n = boxes.length; i < n; i++) {
        boxes[i].relPosition = {
          x: BoxCreator.getRight(boxes[i - 1]) + distance,
          y: boxes[0].relPosition.y,
        };
      }

      return {
        width: BoxCreator.getRight(boxes[boxes.length - 1]) - start.x,
        height: Math.max(...boxes.map(b => b.size.height)),
      };
    } else {
      return {
        width: 0,
        height: 0,
      };
    }
  }

  private static hcAlign(
    boxes: {size: Size; relPosition: Position}[][],
    margin: number
  ) {
    if (boxes.length > 0) {
      const widths = boxes.map(row => this.getSize(row, 0).width);
      const maxWidth = Math.max(0, ...widths);

      boxes.forEach((row, index) => {
        if (row.length > 0) {
          const startPos = row[0].relPosition.x;
          const delta = (maxWidth - widths[index]) / 2 + margin - startPos;
          row.forEach(box => (box.relPosition.x += delta));
        }
      });
    }
  }

  /**
   * horizontally centers elements (fits the relative x position) with respect to centerX
   * @param elements
   * @param centerX
   */
  private static cAlign(
    elements: {size: Size; relPosition: Position}[],
    centerX: number
  ) {
    elements.forEach(el => (el.relPosition.x = centerX - el.size.width / 2));
  }

  private static getSize(
    boxes: {relPosition: Position; size: Size}[],
    margin: number
  ): Size {
    margin *= 2;

    if (boxes.length === 0) {
      return {width: margin, height: margin};
    } else {
      const minX = Math.min(...boxes.map(b => b.relPosition.x));
      const minY = Math.min(...boxes.map(b => b.relPosition.y));
      const maxX = Math.max(...boxes.map(b => BoxCreator.getRight(b)));
      const maxY = Math.max(...boxes.map(b => BoxCreator.getBottom(b)));

      return {width: maxX - minX + margin, height: maxY - minY + margin};
    }
  }

  private static move(boxes: VisioBox[], move: Position) {
    boxes.forEach(b => {
      b.relPosition.x += move.x;
      b.relPosition.y += move.y;
    });
  }

  constructor(
    private labelCreator: LabelCreator,
    private infoProvider: InformationProvider
  ) {
    this.stationIdToBoxMap = new Map();
    this.lotIdToBoxMap = new Map();
    this.stationLots = new Map();
    this.portToBox = new Map();
  }

  createInLotBox(inSample: InSampleInformation) {
    const lotInfo: LotInformation = this.infoProvider.getLotInfo(
      inSample.lotId
    );
    const lotBox: VisioBox = this.createLotBox(lotInfo, inSample.samples);
    lotBox.ports = [];
    return lotBox;
  }

  getLotBox(lotInfo: LotInformation): VisioBox | undefined {
    return this.lotIdToBoxMap.get(lotInfo.id);
  }

  createProdLotBox(lotInfo: LotInformation): VisioBox {
    const lotBox: VisioBox = this.createLotBox(lotInfo, lotInfo.samples);

    this.lotIdToBoxMap.set(lotInfo.id, lotBox);
    lotBox.ports.forEach(p => {
      this.portToBox.set(p, lotBox);
    });
    this.lotIdToBoxMap.get(lotInfo.id);
    return lotBox;
  }

  createLotBox(
    lotInfo: LotInformation,
    samples: SampleInformation[]
  ): VisioBox {
    const labels = this.labelCreator.getLotLabel(lotInfo);
    const labelBottom = BoxCreator.getBottom(labels);

    const sampleBoxes: VisioBox[] = samples.map(s =>
      this.createLotSampleBox(s)
    );
    const sampleAreaStart: Position = {
      x: GraphSettings.LOT_BOX_MARGIN,
      y: labelBottom + GraphSettings.SECTION_DISTANCE,
    };
    BoxCreator.vAlign(
      sampleBoxes,
      sampleAreaStart,
      GraphSettings.SAMPLE_BOX_DISTANCE
    );

    const lotBox: VisioBox = {
      type: BoxType.Lot,
      labels: labels,
      size: BoxCreator.getSize(
        concat<IWithSizeAdRelPos>(labels, sampleBoxes),
        GraphSettings.LOT_BOX_MARGIN
      ),
      relPosition: {x: 0, y: 0},
      ports: [
        {
          id: 'p' + this.portCounter++,
          normalizedPosition: {
            x: 0.5,
            y: 1,
          },
        },
      ],
      elements: sampleBoxes,
    };

    // center align label
    BoxCreator.cAlign(labels, lotBox.size.width / 2);
    if (sampleBoxes.length > 0) {
      // center align samples
      BoxCreator.cAlign(sampleBoxes, lotBox.size.width / 2);
    }
    return lotBox;
  }

  getStationBox(stationInfo: StationInformation): VisioBox | undefined {
    return this.stationIdToBoxMap.get(stationInfo.id);
  }

  createStationBox(stationInfo: StationInformation): VisioBox {
    const labels = this.labelCreator.getStationLabel(stationInfo);

    const boxAreaStart: Position = {
      x: GraphSettings.STATION_BOX_MARGIN,
      y: BoxCreator.getBottom(labels) + GraphSettings.SECTION_DISTANCE,
    };

    const inLotBoxes = stationInfo.inSamples.map(is => this.createInLotBox(is));
    if (inLotBoxes.length > 0) {
      BoxCreator.hAlign(
        inLotBoxes,
        boxAreaStart,
        GraphSettings.SAMPLE_BOX_DISTANCE
      );
      boxAreaStart.y =
        Math.max(...inLotBoxes.map(b => BoxCreator.getBottom(b))) +
        GraphSettings.SECTION_DISTANCE;
    }

    const sampleBoxes = stationInfo.samples.map(sample =>
      this.createStationSampleBox(sample)
    );
    if (sampleBoxes.length > 0) {
      BoxCreator.hAlign(
        sampleBoxes,
        boxAreaStart,
        GraphSettings.SAMPLE_BOX_DISTANCE
      );
      boxAreaStart.y =
        Math.max(...sampleBoxes.map(b => BoxCreator.getBottom(b))) +
        GraphSettings.SECTION_DISTANCE;
    }

    const lotBoxes = concat(
      ...stationInfo.products.map(p =>
        p.lots.map(lot => this.createProdLotBox(lot))
      )
    );
    if (lotBoxes.length > 0) {
      BoxCreator.hAlign(lotBoxes, boxAreaStart, GraphSettings.LOT_BOX_DISTANCE);
    }

    const stationBox: VisioBox = {
      type: BoxType.Station,
      labels: labels,
      size: BoxCreator.getSize(
        concat<IWithSizeAdRelPos>(labels, inLotBoxes, sampleBoxes, lotBoxes),
        GraphSettings.STATION_BOX_MARGIN
      ),
      relPosition: {x: 0, y: 0},
      ports: [
        {
          id: 'p' + this.portCounter++,
          normalizedPosition: {
            x: 0.5,
            y: 0,
          },
        },
      ],
      elements: concat(inLotBoxes, sampleBoxes, lotBoxes),
    };

    BoxCreator.hcAlign(
      [labels, inLotBoxes, sampleBoxes, lotBoxes],
      GraphSettings.STATION_BOX_MARGIN
    );

    this.stationIdToBoxMap.set(stationInfo.id, stationBox);
    stationBox.ports.forEach(p => {
      this.portToBox.set(p, stationBox);
    });
    this.stationLots.set(stationBox, lotBoxes);

    return stationBox;
  }

  createLotSampleBox(sampleInfo: SampleInformation): VisioBox {
    const labels = this.labelCreator.getLotSampleLabel(sampleInfo);
    const boxSize = BoxCreator.getSize(labels, GraphSettings.SAMPLE_BOX_MARGIN);

    return {
      type: BoxCreator.getSampleType(sampleInfo),
      relPosition: {x: 0, y: 0},
      ports: [],
      size: boxSize,
      labels: labels,
      elements: [],
    };
  }

  createStationSampleBox(sampleInfo: StationSampleInformation): VisioBox {
    const labels = this.labelCreator.getStationSampleLabel(sampleInfo);
    const boxSize = BoxCreator.getSize(labels, GraphSettings.SAMPLE_BOX_MARGIN);

    return {
      type: BoxCreator.getSampleType(sampleInfo),
      relPosition: {x: 0, y: 0},
      ports: [],
      size: boxSize,
      labels: labels,
      elements: [],
    };
  }

  createGroupBoxes(
    boxGrid: (VisioBox | null)[][],
    cellGroups: {label: string; cells: GridCell[]}[],
    graphLayers: GraphLayer[]
  ): VisioBox[] {
    const groupCreator = new GroupContainerCreator();
    return groupCreator.createGroupBoxes(
      boxGrid,
      cellGroups.map(g => ({
        label: this.labelCreator.getLabel([g.label], 0, {bold: true}),
        cells: g.cells,
      })),
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
        lots.forEach(lot => {
          lot.position = {
            x: station.position!.x + lot.relPosition.x,
            y: station.position!.y + lot.relPosition.y,
          };
          this.resetSubElementAbsPositions(lot);
        });
      }
    });
  }

  private resetSubElementAbsPositions(box: VisioBox) {
    for (const element of box.elements) {
      element.position = {
        x: box.position!.x + element.relPosition.x,
        y: box.position!.y + element.relPosition.y,
      };
    }
  }
}
