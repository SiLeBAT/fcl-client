import { StationData, SampleResultType } from '../../data.model';

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

export enum StationGroupType {
    Country
}

export interface VisioEngineConfiguration {
    reportType: ReportType;
    groupType: StationGroupType;
}
export interface LotInformation {
    id: string; // internal id
    key: string; // this key is for sample assignment only
    commonProductName: string;
    brandName: string;
    product: string;
    lotIdentifier: string; // Lot identifier
    productionOrDurabilityDate: string; // time / durability
    quantity: string; // Quantity
    samples: SampleInformation[];
    deliveries: DeliveryInformation[];
}

export interface StationSampleInformation extends SampleInformation {
    material: string;
}

export interface StationInformation {
    id: string;
    data: StationData;
    ctno: string;
    name: string; // FBO / establishment identifier
    registrationNumber: string; //  Registration number(s)
    sector: string; // - Food/feed sector
    activities: string; // - Activities / step in the food chain
    samples: StationSampleInformation[];
    inSamples: InSampleInformation[];
    products: ProductInformation[];
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
