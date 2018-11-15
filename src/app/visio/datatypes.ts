import {Graph, Vertex, Edge} from './general-data-structures';

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

/*export interface Port<T extends Company | Lot> {
  position: Position;
  inLinke
  //type: PortType;
  //context: T;
}*/

export enum LinkType {
  DELIVERY_END = 0 as number,
  DELIVERY_SEGMENT = 1 as number
}

/*export interface Link<T> {
  from: Port;
  to: Port;
  type: LinkType;
}*/

export class NestedLayeredGraph implements Graph<Vertex, Edge<Vertex>> {
  vertices: Vertex[];
  private vertexToCompany: Map<Vertex, Company> = new Map();
  private innerLayers: Map<Company, Vertex[][]> = new Map();
  private keyToVertex: Map<string, Vertex> = new Map();
  public outerLayers: Vertex[][]; // = new Map();

  public insertPort(key: string, company: Company): Vertex {
    const vertex: Vertex = {
      index: this.vertices.length,
      inEdges: [],
      outEdges: []
    };
    this.vertices.push(vertex);
    this.vertexToCompany.set(vertex, company);
    this.keyToVertex.set(key, vertex);
    return vertex;
  }

  public addInnerLayers(layers: Vertex[][], company: Company) {
    this.innerLayers.set(company, layers);
  }

  public getPort(key: string) {
    return this.keyToVertex.get(key);
  }
}

