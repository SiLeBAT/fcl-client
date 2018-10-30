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
  //name: string;
  products: Product[] = [];
  incomings: Delivery[] = [];
  position: Position;
  size: Size;
}

export interface Product {
  id: string;
  index: number;
  lots: Lot[];
  //position: Position;
  //size: Size;
}
export interface Lot {
  id: string;
  index: number;
  ingredients: Delivery[];
  deliveries: Delivery[];
  position: Position;
  size: Size;
}
export interface IncomingSample {
  id: string;
  size: Size;
  position: Position;
}
export interface Delivery {
  id: string;
  lotId: string;
  recipientId: string;
  label: {
    position: Position;
    size: Size;
  }
  samples: IncomingSample[];
}

export class VisioGraph {
  countries: Country[];
}