export interface Position {
  x: number;
  y: number;
}
export interface Size {
  width: number;
  height: number;
}

export class Country {
  id: string;
  name: string;
  companies: Company[];
  position: Position;
  size: Size;
}

export class Company {
  id: string;
  index: number;
  country: Country;
  products: Product[] = [];
  incomings: Delivery[] = [];
  position: Position;
  size: Size;
}

export interface Product {
  id: string;
  index: number;
  company: Company;
  lots: Lot[];
}
export interface Lot {
  id: string;
  index: number;
  product: Product;
  ingredients: Delivery[];
  deliveries: Delivery[];
  position: Position;
  size: Size;
}
export interface IncomingSample {
  id: string;
  delivery: Delivery;
  size: Size;
  position: Position;
}
export interface Delivery {
  id: string;
  lotId: string;
  lot: Lot;
  recipientId: string;
  label: {
    position: Position;
    size: Size;
  };
  samples: IncomingSample[];
}

export class VisioGraph {
  countries: Country[];
}

export enum PortType {
  INPORT = 0 as number,
  OUTPORT = 1 as number,
}

export interface Port<T extends Company | Lot> {
  position: Position;
  type: PortType;
  context: T;
}

export enum LinkType {
  DELIVERY_END = 0 as number,
  DELIVERY_SEGMENT = 1 as number
}

export interface Link {
  from: Port;
  to: Port;
  type: LinkType;
}

