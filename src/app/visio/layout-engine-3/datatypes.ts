import {StationData} from './../../util/datatypes';
import { isType } from '@angular/core/src/type';

export interface Position {
    x: number;
    y: number;
}

export interface Size {
    width: number;
    height: number;
}

export interface VisioPort {
    id: string;
    connections: string[]; // array of Connector ids
}

export interface GridCell {
    row: number;
    column: number;
}

export type Polygon = Position[];

export interface GroupShape {
    outerBoundary: Polygon;
    holes: Polygon[];
}

export enum BoxType {
    Station, Lot, StationGroup, SampleNegative, SampleConfirmed, SampleProbable
}

export enum SampleResultType {
    Confirmed, Negative, Probable
}

export interface VisioBox {
    type: BoxType;
    position: Position;
    relPosition: Position;
    size: Size;
    inPorts: VisioPort[];
    outPorts: VisioPort[];
    // memberOf: VisioBox;
    // shape: Position[];
    label: VisioLabel;
}

export interface VisioContainer extends VisioBox {
    elements: VisioBox[];
}

export interface NonConvexVisioContainer extends VisioContainer {
    shape: GroupShape;
}

export enum ConnectorType {
    DeliveryForward, DeliveryBackward
}

export interface VisioConnector {
    id: string;
    type: ConnectorType;
    fromPortId: string;
    toPortId: string;
}

export interface VisioGraph {
    elements: VisioBox[];
    connectors: VisioConnector[];
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
    date: string;
}

export interface InSampleInformation {
    deliveryId: number;
    sample: SampleInformation[];
}

export interface SampleInformation {
    type: string;
    time: string;
    amount: string;
    result: string;
    resultType: SampleResultType;
}

export interface ProductInformation {
    id: number;
    name: string;
    lots: LotInformation[];
}

export interface LotInformation {
    commonProductName: string;
    brandName: string;
    product: string;
    lotIdentifier: string; // Lot identifier
    productionOrDurabilityDate: string; // time / durability
    quantity: string; // Quantity
    samples: SampleInformation[];
}

export interface StationSampleInformation extends SampleInformation {
    material: string;
}

export interface StationInformation {
    data: StationData;
    ctno: string;
    name: string; //FBO / establishment identifier
    registrationNumber: string; //  Registration number(s)
    sector: string; // - Food/feed sector
    activities: string; // - Activities / step in the food chain
    samples: StationSampleInformation[];
    inSamples: InSampleInformation[];
    products: ProductInformation[];
    // lots: LotInformation[];
}

export interface CaseInformation {
    cases: number;
    deaths: number;
    lots: LotInformation[];
    dateOfSymptoms: string;
    disease: string; // disease / confirmation
}

export interface VisioInformation {
    stations: StationInformation[];
    cases: CaseInformation[];
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

export enum ReportType {
    Confidential, Public
}

export interface VisioReporter {
    getLotLabel(lotInfo: LotInformation): VisioLabel;
    getStationLabel(companyInfo: StationInformation): VisioLabel;
    getSampleLabel(sampleInfo: SampleInformation): VisioLabel;
}

export interface FontMetrics {
    measureTextWidth(text: string[]): number;
    measureText(text: string[]): {width: number, height: number};
}
