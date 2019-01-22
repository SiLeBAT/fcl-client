import {StationData, DeliveryData, Connection, FclElements} from '../util/datatypes';
// import {VisioGraph, Country, Company, Product, Lot, Delivery} from './layout-engine/datatypes';
import {VisioLayoutComponent, VisioLayoutData} from './visio-dialog/visio-dialog.component';
import {MatDialog, MatMenuTrigger, MatSlider} from '@angular/material';
// import {aggregateGraph} from './data-aggregation';
// import {layout} from './layout-engine-3/layout-engine';
// import {assignCompaniesToLayers, convertToPortLayers} from './layer_assigner';
// import {Port} from './layout-engine/datatypes';
import { SvgRenderer } from './layout-engine-3/svg-renderer';
import { VisioReport, ReportType } from './layout-engine-3/datatypes';
// import { createReport } from './confidential-visio-reporter';
import { VisioReporter } from './layout-engine-3/visio-reporter';
import { StationByCountryGrouper } from './layout-engine-3/station-by-country-grouper';

/*function convertToVisioGraph(stations: StationData[], deliveries: DeliveryData[], connections: Connection[]): VisioGraph {
  const visioGraph: VisioGraph = new VisioGraph;
  const nameToCountryMap: Map<string, Country> = new Map();
  const idToCompanyMap: Map<string, Company> = new Map();
  const idToProductMap: Map<string, Product> = new Map();
  const idToLotMap: Map<string, Lot> = new Map();
  const idToDeliveryMap: Map<string, Delivery> = new Map();

  for (const station of stations) {
    const countryName: string = station.properties['country'];
    if (!nameToCountryMap.has(countryName)) {
      visioGraph.countries.push({
        id: (visioGraph.countries.length + 1).toString(),
        name: countryName,
        companies: [],
        position: null,
        size: null
      });
      nameToCountryMap.set(countryName, visioGraph.countries[visioGraph.countries.length - 1]);
    }
    const country: Country = nameToCountryMap.get(countryName);
    country.companies.push({
      id: station.id,
      index: idToCompanyMap.size,
      country: country,
      incomings: [],
      products: [],
      position: null,
      size: null
    });
    idToCompanyMap.set(station.id, country.companies[country.companies.length - 1]);
  }
  for (let iDelivery = 0, nDeliveries: number = deliveries.length; iDelivery < nDeliveries; iDelivery++) {
    const delivery = deliveries[iDelivery];
    const target: Company = idToCompanyMap.get(delivery.originalTarget);
    const source: Company = idToCompanyMap.get(delivery.originalSource);
    const productId: string = source.index + '_' + delivery.name;
    if (!idToProductMap.has(productId)) {
      source.products.push({
        id: productId,
        index: idToProductMap.size,
        company: source,
        lots: []
      });
      idToProductMap.set(productId, source.products[source.products.length - 1]);
    }
    const product: Product = idToProductMap.get(productId);
    const lotId: string = product.index + '_' + delivery.lot;
    if (!idToLotMap.has(lotId)) {
      product.lots.push({
        id: lotId,
        index: idToLotMap.size,
        product: product,
        ingredients: [],
        deliveries: [],
        position: null,
        size: null
      });
      idToLotMap.set(lotId, product.lots[product.lots.length - 1]);
    }
    const lot: Lot = idToLotMap.get(lotId);
    target.incomings.push({
      id: delivery.id,
      lotId: lot.id,
      lot: lot,
      recipientId: target.id,
      label: null,
      samples: [],
    });
    idToDeliveryMap.set(delivery.id, target.incomings[target.incomings.length - 1]);
  }
  for (const station of stations) {
    for (const connection of station.connections) {
      if (idToDeliveryMap.has(connection.source) && idToDeliveryMap.has(connection.target)) {
        const fromDelivery: Delivery = idToDeliveryMap.get(connection.source);
        const toDelivery: Delivery = idToDeliveryMap.get(connection.target);
        idToLotMap.get(toDelivery.lotId).ingredients.push(fromDelivery);
      }
    }
  }
  return visioGraph;
}
*/

/*
function initLotSizes(visioGraph: VisioGraph) {
  // computes space requirements for each lot
  for (const country of visioGraph.countries) {
    for (const company of country.companies) {
      for (const product of company.products) {
        for (const lot of product.lots)  {
          lot.size = {width: 10, height: 20 + 20 * Math.random()};
        }
      }
    }
  }
}*/
/*
export function createVisioGraph(stations: StationData[], deliveries: DeliveryData[], connections: Connection[]): string {
  const visioGraph: VisioGraph = convertToVisioGraph(stations, deliveries, connections);
  aggregateGraph(visioGraph);
  layout(visioGraph);
  // ToDo: split Countries
  // const companyLayers: Company[][] = assignCompaniesToLayers(visioGraph.countries);
  // const portLayers: Port<Company|Lot>[][] = convertToPortLayers(companyLayers);

  return null;
}
*/
function getFontMetricCanvas(): any {

}

export function showVisioGraph(data: FclElements, dialogService: MatDialog) {
  // const visioGraph: any = null;
  const stationGrouper =  new StationByCountryGrouper();
  const report: VisioReport = VisioReporter.createReport(data, getFontMetricCanvas, ReportType.Confidential, stationGrouper );
  const layoutData: VisioLayoutData = { data: SvgRenderer.renderReport(report) };
  dialogService.open(VisioLayoutComponent, layoutData).afterClosed().subscribe(() => {

  });
}
