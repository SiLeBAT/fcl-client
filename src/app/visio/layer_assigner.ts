import {Company, Country, Lot, Delivery, NestedLayeredGraph, VisioGraph} from './datatypes';
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
  const outerLayers: Vertex[][] = [];
  // add all Ports
  for (const companyLayer of companyLayers) {
    for (const company of companyLayer) {
      for (const delivery of company.incomings) {
        if (delivery.lot.product.company !== company) {
          // no selfloop
          graph.insertPort(getCompanyOutportKey(delivery), delivery.lot.product.company);
          graph.insertPort(getCompanyInportKey(delivery), company);
        }
        graph.insertPort(getLotOutportKey(delivery.lot), delivery.lot.product.company);
      }
      for (const product of company.products) {
        for (const lot of product.lots) {
          if (lot.ingredients !== null && lot.ingredients.length > 0) {
            graph.insertPort(getLotInportKey(lot), company);
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
