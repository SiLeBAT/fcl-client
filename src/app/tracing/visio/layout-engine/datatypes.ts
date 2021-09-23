import { StationData, SampleResultType } from '../../data.model';
import { ROASettings } from '../model';

export interface Position {
    x: number;
    y: number;
}

export interface Size {
    width: number;
    height: number;
}

export interface NodeLayoutInfo {
    size: number;
    position: Position;
    extent: {
        top: number;
        bottom: number;
    };
}

export interface VisioPort {
    id: string;
    normalizedPosition: Position;
}

export interface GridCell {
    row: number;
    column: number;
}

export type Polygon = Position[];

export interface CustomBoxShape {
    outerBoundary: Polygon;
    holes: Polygon[];
}

export enum BoxType {
    Station, Lot, StationGroup, SampleNegative, SampleConfirmed, SampleProbable, SampleUnknown
}

export interface VisioBox {
    type: BoxType;
    position: Position;
    relPosition: Position;
    size: Size;
    ports: VisioPort[];
    elements: VisioBox[];
    shape: CustomBoxShape;
    label: VisioLabel;
}

export enum ConnectorType {
    DeliveryForward, DeliveryBackward
}

export interface VisioConnector {
    id: string;
    type: ConnectorType;
    fromPort: string;
    toPort: string;
}

export interface VisioGraph {
    elements: VisioBox[];
    connectors: VisioConnector[];
    size: Size;
}

export interface GraphLayer {
    activities: string[];
    height: number;
}

export interface VisioLabel {
    text: string[];
    relPosition: Position;
    size: Size;
}

export interface StationGrouper {
    areStationsInTheSameGroup(s1: StationData, s2: StationData): boolean;
    getGroupLabel(stations: StationData);
    groupStations(stations: StationData[]): {label: string, stations: StationData[]}[];
}

export interface DeliveryInformation {
    forward: boolean;
    backward: boolean;
    date: string;
    target: string;
}

export interface InSampleInformation {
    lotId: string;
    samples: SampleInformation[];
}

export interface SampleInformation {
    props: { [key: string]: string|number|boolean };
    resultType: SampleResultType;
}

export interface ProductInformation {
    id: number;
    lots: LotInformation[];
}

export enum StationGroupType {
    Country
}

export interface VisioEngineConfiguration {
    roaSettings: ROASettings;
    groupType: StationGroupType;
}

export interface LotInformation {
    id: string; // internal id
    key: string; // this key is for sample assignment only
    props: { [key: string]: string|number|boolean };
    samples: SampleInformation[];
    deliveries: DeliveryInformation[];
}

export interface StationSampleInformation extends SampleInformation {
}

export interface StationInformation {
    id: string;
    data: StationData;
    ctno: string;
    props: { [key: string]: string | number | boolean };
    activities: string | null; // - Activities / step in the food chain
    samples: StationSampleInformation[];
    inSamples: InSampleInformation[];
    products: ProductInformation[];
}

export interface CaseInformation {
    props: { [key: string]: string|number|boolean };
}

export interface GroupInformation {
    label: string;
    stations: StationInformation[];
}

export interface InformationGraph {
    groups: GroupInformation[];
}
export interface VisioRowHeader {
    label: string;
}
export interface VisioReport {
    graph: VisioGraph;
    graphLayers: GraphLayer[];
}

export interface FontMetrics {
    measureTextWidth(text: string[]): number;
    measureText(text: string[]): {width: number, height: number};
}
