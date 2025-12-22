import { ClientRequest } from '@mempool/shared';

export function insertSortedDescending<T>(arr: ClientRequest[], item: ClientRequest) {
  const amount = item.amount;
  let left = 0,
    right = arr.length;

  while (left < right) {
    const mid = (left + right) >>> 1;
    if (arr[mid].amount > amount) {
      left = mid + 1;
    } else {
      right = mid;
    }
  }

  arr.splice(left, 0, item);
}
