import {VisioGraph, Country, Company, Lot} from './datatypes';

export function convertVisioGraphToSvg(graph: VisioGraph): string {
  const shapes: string[] = [];

  for (const country of graph.countries) {
    shapes.push(convertCountryToSvgShape(country));
    for (const company of country.companies) {
      shapes.push(convertCompanyToSvgShape(company));
      for (const product of company.products) {
        for (const lot of product.lots) {
          shapes.push(convertLotToSvgShape(lot));
        }
      }
    }
  }
  for (const country of graph.countries) {
    shapes.push(convertCountryToSvgShape(country));
    for (const company of country.companies) {
      company.inPorts
      shapes.push(convertCompanyToSvgShape(company));
      for (const product of company.products) {
        for (const lot of product.lots) {
          shapes.push(convertLotToSvgShape(lot));
        }
      }
    }
  }
  return shapes.join('\n');
}

function convertCountryToSvgShape(country: Country): string {
  return '<rect x="' + country.position.x.toString() + '" y="' + country.position.y + '" ' +
    ' rx="5" ry="5" width="' + country.size.width + '" height="' + country.size.height.toString() + '"' +
    '\nstyle="fill:red;stroke:black;stroke-width:2;opacity:0.5" />';
}
function convertCompanyToSvgShape(company: Company): string {
  return '<rect x="' + company.position.x.toString() + '" y="' + company.position.y + '" ' +
    ' rx="5" ry="5" width="' + company.size.width + '" height="' + company.size.height.toString() + '"' +
    '\nstyle="fill:blue;stroke:black;stroke-width:2;opacity:0.5" />';
}
function convertLotToSvgShape(lot: Lot): string {
  return '<rect x="' + lot.position.x.toString() + '" y="' + lot.position.y + '" ' +
    ' rx="5" ry="5" width="' + lot.size.width + '" height="' + lot.size.height.toString() + '"' +
    '\nstyle="fill:green;stroke:black;stroke-width:2;opacity:0.5" />';
}
