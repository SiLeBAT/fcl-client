import * as _ from 'lodash';
import { VisioReport, VisioBox, StationInformation, LotInformation, GraphLayer, FontMetrics,
    VisioContainer, SampleInformation, BoxType, VisioLabel, Size, ReportType, StationGrouper } from './datatypes';
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

export class VisioReporter {

    static createReport(data: FclElements, canvas: any, type: ReportType, stationGrouper: StationGrouper): VisioReport {
        const stationGrid = assignToGrid(data);
        // const stationGroups = stationGrouper.groupStations([].concat(...stationGrid));
        const infoProvider = new InformationProvider(data);
        const cellGroups = getCellGroups(stationGrid, stationGrouper);

        const labelCreator = this.getLabelCreator(type, this.getFontMetrics(canvas));
        const boxCreator = new BoxCreator(labelCreator);

        const infoGrid = this.mapMatrix(stationGrid, (s) => s !== null ? infoProvider.getStationInfo(s) : null );
        const boxGrid = this.mapMatrix(infoGrid, (info) =>  info !== null ? boxCreator.getStationBox(info) : null );

        const graphLayers: GraphLayer[] = this.getGraphLayers(infoGrid);

        const groupBoxes = boxCreator.getGroupBoxes(boxGrid, cellGroups, graphLayers);

        const result: VisioReport = {
            graph: {
                elements: groupBoxes,
                connectors: []
            },
            graphLayers: graphLayers
        };

        return result;
    }

    private static getFontMetrics(canvas: any): FontMetrics {
        return {
            measureTextWidth: (text: string[]) => 80,
            measureText: (text: string[]) => ({
                width: 80,
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

    private static getGraphLayers(infoGrid: StationInformation[][]): GraphLayer[] {
        return infoGrid.map(layer => ({
                activities: _.uniq(layer.map(info => info !== null ? info.activities : null).filter(t => t !== null)),
                height: null
            }));
        }

}
