import {LinkGroup, GroupInfoFun} from './model';
import {GroupData} from '../data.model';
import * as _ from 'lodash';

export function extractNewGroups(
  map: Map<string, LinkGroup>,
  getGroupInfo: GroupInfoFun
): GroupData[] {
  const compareNumbers = (a, b) => (a < b ? -1 : a === b ? 0 : 1);
  const newGroups: GroupData[] = [];

  map.forEach(linkStation => {
    linkStation.linkedStations.sort((a, b) =>
      compareNumbers(a.linkKeys.length, b.linkKeys.length)
    );

    let size = 0;
    const linkIndices: Set<number> = new Set();
    // eslint-disable-next-line one-var
    for (
      let iLS = 0, nLS: number = linkStation.linkedStations.length;
      iLS < nLS;
      iLS++
    ) {
      if (linkStation.linkedStations[iLS].linkKeys.length !== size) {
        addNewGroups(linkStation, newGroups, linkIndices, getGroupInfo);
        size = linkStation.linkedStations[iLS].linkKeys.length;
      }
      linkIndices.add(iLS);
    }
    addNewGroups(linkStation, newGroups, linkIndices, getGroupInfo);
  });
  return newGroups;
}

export function addNewGroups(
  linkGroup: LinkGroup,
  newGroups: GroupData[],
  linkIndices: Set<number>,
  getGroupInfo: GroupInfoFun
) {
  if (linkIndices.size > 1) {
    let groupMembers: string[] = [];
    while (linkIndices.size > 0) {
      const compareIndex: number = linkIndices.values().next().value;
      linkIndices.delete(compareIndex);

      const compareKeys: string[] =
        linkGroup.linkedStations[compareIndex].linkKeys;
      groupMembers.push(
        linkGroup.linkedStations[compareIndex].linkedStation.id
      );

      const removeIndices: number[] = [];
      linkIndices.forEach(i => {
        if (_.isEqual(compareKeys, linkGroup.linkedStations[i].linkKeys)) {
          removeIndices.push(i);
        }
      });
      removeIndices.forEach(i => {
        linkIndices.delete(i);
        groupMembers.push(linkGroup.linkedStations[i].linkedStation.id);
      });

      if (groupMembers.length > 1) {
        newGroups.push({
          ...getGroupInfo(linkGroup, newGroups.length + 1),
          contains: groupMembers,
        });
      }
      groupMembers = [];
    }
  }
  linkIndices.clear();
}
