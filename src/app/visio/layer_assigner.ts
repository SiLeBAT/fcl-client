import {Company, Country, Lot, Port} from './datatypes';
import {aggregateEdgesOfVertexPairs, removeSelfLoops} from './graph-cleaner';
import {SimpleGraph} from './data-structures';
import {assignLayers} from './layer-assigner';
import {removeCycles } from './cycle-remover';

export function assignCompaniesToLayers(countries: Country[]): Company[][] {
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

export function convertToPortLayers(companyLayers: Company[][]): Port<Company|Lot>[][] {
 const portLayers: Port<Company|Lot>[][] = [];
 for (const companyLayer of companyLayers) {
   
 }
 return [];
}
