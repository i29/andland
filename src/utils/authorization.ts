import {
  EthereumEvent,
  Entity,
  Value,
  Bytes,
  BigInt,
  store
} from '@graphprotocol/graph-ts'
import { NFTType } from '../utils/nft'
import { Authorization } from '../types/schema'
import {
  ApprovalForAll,
  UpdateManager
} from '../types/LANDRegistry/LANDRegistry'

export class AuthorizationType {
  static OWNER: string = 'Owner'
  static OPERATOR: string = 'Operator'
  static UPDATE_OPERATOR: string = 'UpdateOperator'
  static MANAGER: string = 'UpdateManager'
}

export function createAuthorizationId(
  event: EthereumEvent,
  type: string
): string {
  return (
    event.block.number.toString() + '-' + event.logIndex.toString() + '-' + type
  )
}

export function buildAuthorization(
  event: EthereumEvent,
  type: string
): Authorization {
  let id = createAuthorizationId(event, type)
  let authorization = new Authorization(id)

  authorization.type = type
  authorization.tokenAddress = event.address
  authorization.timestamp = buildTimestamp(event)
  authorization.createdAt = event.block.timestamp

  return authorization
}

export function createOwnership(
  authorizationType: string,
  nftType: string,
  eventName: string,
  event: EthereumEvent,
  address: Bytes | null,
  id: BigInt
): void {
  let authorizationId = createAuthorizationId(event, authorizationType)
  let entity: Entity = new Entity()

  entity.set('id', Value.fromString(authorizationId))

  if (address == null) {
    entity.unset('address')
  } else {
    entity.set('address', Value.fromBytes(address!))
  }

  entity.set('eventName', Value.fromString(eventName))
  entity.set('timestamp', Value.fromBigInt(buildTimestamp(event)))
  entity.set('createdAt', Value.fromBigInt(event.block.timestamp))

  setNFT(nftType, entity, id)

  store.set(authorizationType, authorizationId.toString(), entity)
}

function setNFT(nftType: string, entity: Entity, id: BigInt): void {
  if (nftType == NFTType.PARCEL) {
    entity.set('parcel', Value.fromString(id.toHex()))
  } else if (nftType == NFTType.ESTATE) {
    entity.set('estate', Value.fromString(id.toString()))
  }
}

function buildTimestamp(event: EthereumEvent): BigInt {
  return event.block.timestamp
    .times(BigInt.fromI32(1000000))
    .plus(event.logIndex)
}
