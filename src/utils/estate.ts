import { EthereumEvent } from '@graphprotocol/graph-ts'

export function getEstateHistoryId(
  event: EthereumEvent,
  type: string,
  id: string
): string {
  return (
    event.block.number.toString() +
    '-' +
    event.logIndex.toString() +
    '-' +
    type +
    '-' +
    id
  )
}
