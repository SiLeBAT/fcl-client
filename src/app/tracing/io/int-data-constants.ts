import { Map as ImmutableMap } from 'immutable';

const STRING_TYPE = 'string';
const BOOLEAN_TYPE = 'boolean';
const NUMBER_TYPE = 'number';

export const STATION_PROP_TO_REQ_TYPE_MAP: ImmutableMap<
    string,
    string
> = ImmutableMap({
    id: STRING_TYPE,
    name: STRING_TYPE,
    lat: NUMBER_TYPE,
    lon: NUMBER_TYPE,
    country: STRING_TYPE,
    typeOfBusiness: STRING_TYPE
});

export const DELIVERY_PROP_TO_REQ_TYPE_MAP: ImmutableMap<
    string,
    string
> = ImmutableMap({
    id: STRING_TYPE,
    name: STRING_TYPE,
    lot: STRING_TYPE,
    lotKey: STRING_TYPE,
    date: STRING_TYPE,
    source: STRING_TYPE,
    target: STRING_TYPE
});

export const DEL2DEL_PROP_TO_REQ_TYPE_MAP: ImmutableMap<
    string,
    string
> = ImmutableMap({
    source: STRING_TYPE,
    target: STRING_TYPE
});
