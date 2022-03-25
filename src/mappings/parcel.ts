import {
  Transfer,
  Approval,
  UpdateManager,
  UpdateOperator as UpdateOperatorEvent,
  ApprovalForAll,
  Update
} from '../types/LANDRegistry/LANDRegistry'
import { Parcel, Authorization } from '../types/schema'
import {
  AuthorizationType,
  createAuthorizationId,
  buildAuthorization,
  createOwnership
} from '../utils/authorization'
import { NFTType } from '../utils/nft'
import { EventType } from '../utils/event'
import { decodeTokenId } from '../utils/parcel'
import { createWallet } from '../utils/wallet'
import { buildData, DataType } from '../utils/data'

export function handleTransfer(event: Transfer): void {
  let coordinates = decodeTokenId(event.params.assetId)
  let id = event.params.assetId.toHex()
  let parcel = new Parcel(id)

  parcel.x = coordinates[0]
  parcel.y = coordinates[1]
  parcel.tokenId = event.params.assetId
  parcel.owner = event.params.to.toHex()
  parcel.operator = null
  parcel.updateOperator = null
  parcel.updatedAt = event.block.timestamp
  parcel.save()

  createOwnership(
    AuthorizationType.OWNER,
    NFTType.PARCEL,
    EventType.TRANSFER,
    event,
    event.params.to,
    event.params.assetId
  )

  createOwnership(
    AuthorizationType.OPERATOR,
    NFTType.PARCEL,
    EventType.TRANSFER,
    event,
    null,
    event.params.assetId
  )

  createOwnership(
    AuthorizationType.UPDATE_OPERATOR,
    NFTType.PARCEL,
    EventType.TRANSFER,
    event,
    null,
    event.params.assetId
  )

  createWallet(event.params.to)
}

export function handleApproval(event: Approval): void {
  let id = event.params.assetId.toHex()
  let coordinates = decodeTokenId(event.params.assetId)
  let parcel = new Parcel(id)

  parcel.x = coordinates[0]
  parcel.y = coordinates[1]
  parcel.tokenId = event.params.assetId
  parcel.owner = event.params.owner.toHex()
  parcel.operator = event.params.operator
  parcel.updatedAt = event.block.timestamp
  parcel.save()

  createOwnership(
    AuthorizationType.OPERATOR,
    NFTType.PARCEL,
    EventType.APPROVAL,
    event,
    event.params.operator,
    event.params.assetId
  )
}

export function handleUpdateOperator(event: UpdateOperatorEvent): void {
  let id = event.params.assetId.toHex()
  let coordinates = decodeTokenId(event.params.assetId)
  let parcel = new Parcel(id)

  parcel.x = coordinates[0]
  parcel.y = coordinates[1]
  parcel.tokenId = event.params.assetId
  parcel.updateOperator = event.params.operator
  parcel.updatedAt = event.block.timestamp
  parcel.save()

  createOwnership(
    AuthorizationType.UPDATE_OPERATOR,
    NFTType.PARCEL,
    EventType.UPDATE_OPERATOR,
    event,
    event.params.operator,
    event.params.assetId
  )
}

export function handleUpdateManager(event: UpdateManager): void {
  let authorization = buildAuthorization(event, AuthorizationType.MANAGER)
  authorization.owner = event.params._owner.toHex()
  authorization.operator = event.params._operator
  authorization.isApproved = event.params._approved
  authorization.save()

  createWallet(event.params._owner)
}

export function handleApprovalForAll(event: ApprovalForAll): void {
  let authorization = buildAuthorization(event, AuthorizationType.OPERATOR)
  authorization.owner = event.params.holder.toHex()
  authorization.operator = event.params.operator
  authorization.isApproved = event.params.authorized
  authorization.save()

  createWallet(event.params.holder)
}

export function handleUpdate(event: Update): void {
  let id = event.params.assetId.toHex()
  let data = event.params.data.toString()

  let parcel = new Parcel(id)

  let parcelData = buildData(id, data, DataType.PARCEL)
  if (parcelData != null) {
    parcel.data = id
    parcelData.save()
  }

  parcel.save()
}
