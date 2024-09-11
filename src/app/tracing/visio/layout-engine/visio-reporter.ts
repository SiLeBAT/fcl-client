import * as _ from 'lodash';
import {
  VisioReport,
  VisioBox,
  StationInformation,
  GraphLayer,
  Size,
  StationGrouper,
} from './datatypes';
import {
  Position,
  StationData,
  DeliveryData,
  SampleData,
  StationId,
} from '../../data.model';
import {GraphSettings} from './graph-settings';
import {BoxCreator} from './box-creator';
import {assignToGrid} from './grid-assigner';
import {InformationProvider} from './information-provider';
import {getCellGroups} from './cell-grouper';
import {CtNoAssigner} from './ctno-assigner';
import {ConnectorCreator} from './connector-creator';
import {improvePositions} from './station_positioner_lp';
import {groupStationBoxes} from './stationbox-simple-grouper';
import {CustomLabelCreator} from './custom-label-creator';
import {ROASettings} from '../model';
import {getFontMetrics} from './font-metrics';
import {concat, removeNull} from '@app/tracing/util/non-ui-utils';

interface FclElements {
  stations: StationData[];
  deliveries: DeliveryData[];
  samples: SampleData[];
}

export class VisioReporter {
  static createReport(
    data: FclElements,
    statIdToPosMap: Record<StationId, Position>,
    canvas: HTMLCanvasElement | undefined,
    roaSettings: ROASettings,
    stationGrouper: StationGrouper
  ): VisioReport {
    const stationGrid = assignToGrid(data, statIdToPosMap);
    const stationGroups = stationGrouper.groupStations(
      removeNull(concat(...stationGrid))
    );
    const infoProvider = new InformationProvider(data, roaSettings);
    const cellGroups = getCellGroups(stationGrid, stationGroups);

    const fontMetrics = getFontMetrics(canvas);
    const labelCreator = new CustomLabelCreator(
      fontMetrics,
      roaSettings.labelSettings,
      roaSettings.roundNumbers
    );
    const boxCreator = new BoxCreator(labelCreator, infoProvider);

    const infoGrid = this.mapMatrix(stationGrid, s =>
      s ? infoProvider.getStationInfo(s) : null
    );
    CtNoAssigner.assingCtNos(infoGrid);
    const boxGrid = this.mapMatrix(infoGrid, info =>
      info !== null ? boxCreator.createStationBox(info) : null
    );

    const layerInfo: GraphLayer[] = this.getLayerInformation(infoGrid);

    let groupBoxes = boxCreator.createGroupBoxes(
      boxGrid,
      cellGroups,
      layerInfo
    );
    const connectors = new ConnectorCreator(
      boxCreator,
      infoProvider
    ).createConnectors();

    this.setAbsolutePositions(groupBoxes, {x: 0, y: 0});
    boxCreator.resortLotBoxes(connectors);

    const stationBoxGroups = stationGroups.map(sg => ({
      label: sg.label,
      boxes: sg.stations.map(
        s => boxCreator.getStationBox(infoProvider.getStationInfo(s))!
      ),
    }));
    improvePositions(
      boxGrid.map(row => removeNull(row)),
      stationBoxGroups,
      connectors,
      2 * GraphSettings.GRID_MARGIN,
      2 * (GraphSettings.GRID_MARGIN + GraphSettings.GROUP_MARGIN)
    );

    groupBoxes = groupStationBoxes(stationBoxGroups, labelCreator);
    this.setAbsolutePositions(groupBoxes, {x: 0, y: 0});

    const headerLabelHeights = layerInfo.map(
      l => fontMetrics.measureText(l.activities, {bold: true}).height
    );
    const headerWidth = Math.max(
      GraphSettings.HEADER_WIDTH_MIN,
      Math.max(0, ...headerLabelHeights) + GraphSettings.HEADER_PADDING_H * 2
    );

    const result: VisioReport = {
      graph: {
        elements: groupBoxes,
        connectors: connectors,
        size: this.getSize(groupBoxes),
      },
      graphLayers: layerInfo,
      headerWidth: headerWidth,
    };

    return result;
  }

  private static getSize(boxes: VisioBox[]): Size {
    return {
      width:
        Math.max(...boxes.map(b => b.position!.x + b.size.width)) -
        Math.min(...boxes.map(b => b.position!.x)) +
        2 * GraphSettings.GRID_MARGIN,
      height:
        Math.max(...boxes.map(b => b.position!.y + b.size.height)) -
        Math.min(...boxes.map(b => b.position!.y)) +
        2 * GraphSettings.GRID_MARGIN,
    };
  }

  private static mapMatrix<A, B>(matrix: A[][], fn: (a: A) => B): B[][] {
    return matrix.map(array => array.map(element => fn(element)));
  }

  private static getLayerInformation(
    infoGrid: (StationInformation | null)[][]
  ): GraphLayer[] {
    return infoGrid.map(layer => ({
      activities: _.uniq(
        removeNull(layer.map(info => (info !== null ? info.activities : null)))
      ),
      height: 0,
    }));
  }

  private static setAbsolutePositions(boxes: VisioBox[], refPos: Position) {
    for (const box of boxes) {
      box.position = {
        x: refPos.x + box.relPosition.x,
        y: refPos.y + box.relPosition.y,
      };
      this.setAbsolutePositions(box.elements, box.position);
    }
  }
}
