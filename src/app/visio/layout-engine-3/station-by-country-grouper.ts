import {StationGrouper} from './datatypes';
import {StationData} from '../../util/datatypes';

interface StationGroup {
    label: string;
    stations: StationData[];
}

export class StationByCountryGrouper implements  StationGrouper {
    // private stationGroups: StationGroup[];

    areStationsInTheSameGroup(s1: StationData, s2: StationData): boolean {
        const countryPropertyS1 = this.getCountryProperty(s1);
        const countryPropertyS2 = this.getCountryProperty(s2);
        if (countryPropertyS1 === null || countryPropertyS2 === null) {
            // undecidable
            return true;
        } else {
            return countryPropertyS1 === countryPropertyS2;
        }
    }

    getGroupLabel(station: StationData): string {
        const countryProperty = this.getCountryProperty(station);
        return (countryProperty !== null ? countryProperty : 'Country: Unknown');
    }

    private getCountryProperty(station: StationData): string {
        const countryProperties = station.properties.filter(p => p.name.toLocaleLowerCase() === 'country');
        return (countryProperties.length > 0 ? countryProperties[0].value : null);
    }

    groupStations(stations: StationData[]): StationGroup[] {
        const map: Map<string, StationData[]> = new Map();

        stations.forEach( station => {
            const label = this.getGroupLabel(station);

            if (map.has(label)) {
                map.get(label).push(station);
            } else {
                map.set(label, [station]);
            }
        });

        return Array.from(map, ([key, value]) => ({
            label: key,
            stations: value
        }));
    }
}
