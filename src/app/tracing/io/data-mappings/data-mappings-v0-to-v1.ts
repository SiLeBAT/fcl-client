import { DeliveryData } from '../../data.model';
import { Map as ImmutableMap } from 'immutable';
import * as _ from 'lodash';

export const DELIVERY_PROP_V0_TO_V1_MAP: ImmutableMap<
    string,
    keyof DeliveryData
> = ImmutableMap({
    date: 'dateOut'
});
