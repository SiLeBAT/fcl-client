import {DeliveryData} from '../../data.model';
import {Map as ImmutableMap} from 'immutable';

export const DELIVERY_PROP_V0_TO_V1_MAP: ImmutableMap<
  string,
  keyof DeliveryData
> = ImmutableMap({
  date: 'dateOut',
});
