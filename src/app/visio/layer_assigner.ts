import * as _ from 'lodash';
import {Company, Country, Product, Lot, Delivery, NestedLayeredGraph, VisioGraph} from './datatypes';
import {aggregateEdgesOfVertexPairs, removeSelfLoops} from './graph-cleaner';
import {SimpleGraph, Vertex} from './general-data-structures';
import {assignLayers} from './general-layer-assigner';
import {removeCycles } from './cycle-remover';

function assignCompaniesToLayers(countries: Country[]): Company[][] {
  const companies: Company[] = [].concat(countries.map(country => country.companies));
  const graph: SimpleGraph<Company> = constructCompanyGraph(companies);
  aggregateEdgesOfVertexPairs(graph);
  removeSelfLoops(graph);
  removeCycles(graph);
  return assignLayers(graph.vertices).map(layer => layer.map(vertex => vertex.object).filter(company => company !== null));
}

function constructCompanyGraph(companies: Company[]): SimpleGraph<Company> {
  const graph: SimpleGraph<Company> = new SimpleGraph();
  for (const company of companies) {
    graph.insertVertex(company);
  }
  
  for (const company of companies) {
    for (const delivery of company.incomings) { graph.insertEdge(delivery.lot.product.company, company); }
  }
  return graph;
}

function getCompanyInportKey(delivery: Delivery): string {
  return 'CI:' + delivery.id;
}

function getCompanyOutportKey(delivery: Delivery): string {
  return 'CO:' + delivery.id;
}

function getLotInportKey(lot: Lot): string {
  return 'LI:' + lot.id;
}

function getLotOutportKey(lot: Lot): string {
  return 'LO:' + lot.id;
}

function convertCompanyLayersToNestedLayeredGraph(companyLayers: Company[][]): NestedLayeredGraph {
  const graph: NestedLayeredGraph = new NestedLayeredGraph();
  const outerLayers: Vertex[][] = _.fill(Array(companyLayers.length * 2), []);
  const countryPortGroups: Map<Country, Vertex[]> = new Map();
  const companyPortGroups: Map<Company, Vertex[]> = new Map();
  const productPortGroups: Map<Product, Vertex[]> = new Map();
  const lotPortGroups: Map<Lot, Vertex[]> = new Map();
  const companyToLayerIndex: Map<Company, number> = new Map();
  const companies: Company[] = [].concat(...companyLayers);
  const countries: Country[] = companies.map(company => company.country);

  for (const country of countries) { countryPortGroups.set(country, []); }
  // for (const company of companies) { companyPortGroups.set(company, []); }
  for (const company of companies) {
    companyPortGroups.set(company, []);
    for (const product of company.products) {
      productPortGroups.set(product, []);
      for (const lot of product.lots) {
        lotPortGroups.set(lot, []);
      }
    }
  }

  // add all Ports
  for (const companyLayer of companyLayers) {
    const inLayer: Vertex[] = [];
    for (const company of companyLayer) {
      const innerPorts: Vertex[] = [];
      for (const delivery of company.incomings) {
        if (delivery.lot.product.company !== company) {
          // no selfloop
          const companyOutPort: Vertex = graph.insertPort(getCompanyOutportKey(delivery), delivery.lot.product.company);
          companyPortGroups.get(delivery.lot.product.company).push(companyOutPort);
          const companyInPort: Vertex = graph.insertPort(getCompanyInportKey(delivery), company);
        }
        const lotOutPort: Vertex = graph.insertPort(getLotOutportKey(delivery.lot), delivery.lot.product.company);
        innerPorts.push(lotOutPort);
        lotPortGroups.get(delivery.lot).push(lotOutPort);
      }
      for (const product of company.products) {
        for (const lot of product.lots) {
          if (lot.ingredients !== null && lot.ingredients.length > 0) {
            const lotInPort: Vertex = graph.insertPort(getLotInportKey(lot), company);
            innerPorts.push(lotInPort);
          }
        }
      }
    }
  }
  // add all Links
  for (const companyLayer of companyLayers) {
    const inLayer: Vertex[] = [];
    const outLayer: Vertex[] = [];
    for (const company of companyLayer) {
      for (const delivery of company.incomings) {
        inLayer.push(Port)
      }
    }
    const newPortLayers: Port<Company|Lot>[][] = [];
    
  }
  return [];
}

export function createLayeredNestedGraph(visioGraph: VisioGraph): NestedLayeredGraph {
  
  const companyLayers: Company[][] = assignCompaniesToLayers(visioGraph.countries);
  
  
}
