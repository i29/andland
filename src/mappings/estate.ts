import { Bytes } from '@graphprotocol/graph-ts'
import {
  CreateEstate,
  AddLand,
  RemoveLand,
  Transfer,
  Approval,
  UpdateManager,
  UpdateOperator as UpdateOperatorEvent,
  ApprovalForAll,
  Update
} from '../types/EstateRegistry/EstateRegistry'
import { Estate, EstateHistory, Parcel, Authorization } from '../types/schema'
import {
  AuthorizationType,
  createAuthorizationId,
  buildAuthorization,
  createOwnership
} from '../utils/authorization'
import { NFTType } from '../utils/nft'
import { EventType } from '../utils/event'
import { decodeTokenId } from '../utils/parcel'
import { getEstateHistoryId } from '../utils/estate'
import { createWallet } from '../utils/wallet'
import { buildData, DataType } from '../utils/data'
import * as addresses from '../utils/addresses'

export function handleCreateEstate(event: CreateEstate): void {
  let id = event.params._estateId.toString()
  let data = event.params._data.toString()

  let estate = new Estate(id)

  estate.owner = event.params._owner.toHex()
  estate.parcels = []
  estate.size = 0
  estate.createdAt = event.block.timestamp

  let estateData = buildData(id, data, DataType.ESTATE)
  if (estateData != null) {
    estate.data = id
    estateData.save()
  }

  estate.save()

  createWallet(event.params._owner)
}

export function handleAddLand(event: AddLand): void {
  let estateId = event.params._estateId.toString()
  let parcelId = event.params._landId.toHex()
  let estate = Estate.load(estateId)

  let parcels = estate.parcels
  parcels.push(parcelId)

  estate.parcels = parcels
  estate.size = parcels.length
  estate.save()

  let parcel = Parcel.load(parcelId)

  // Would expect that this isn't needed, but it is here for safety, since failing at block 6,000,000 slows down iterative testing
  // Because if land parcel doesn't exist, we get a crashed node
  if (parcel == null) {
    let coordinates = decodeTokenId(event.params._landId)

    parcel = new Parcel(parcelId)
    parcel.x = coordinates[0]
    parcel.y = coordinates[1]
    parcel.tokenId = event.params._landId
  }

  parcel.owner = addresses.EstateRegistry
  parcel.estate = estateId
  parcel.save()

  let estateHistory = new EstateHistory(
    getEstateHistoryId(event, 'AddLand', estateId)
  )
  estateHistory.estateId = estateId
  estateHistory._prevEstateId = estateId
  estateHistory.parcel = parcelId
  estateHistory.createdAt = event.block.timestamp
  estateHistory.save()
}

export function handleRemoveLand(event: RemoveLand): void {
  let estateId = event.params._estateId.toString()
  let parcelId = event.params._landId.toHex()
  let estate = Estate.load(estateId)

  let parcels = estate.parcels
  let index = parcels.indexOf(parcelId)
  parcels.splice(index, 1)

  estate.parcels = parcels
  estate.size = parcels.length
  estate.save()

  let parcel = Parcel.load(parcelId)
  // Would expect that this isn't needed, but it is here for safety, since failing at block 6,000,000 slows down iterative testing
  // Because if land parcel doesn't exist, we get a crashed node
  if (parcel == null) {
    let coordinates = decodeTokenId(event.params._landId)

    parcel = new Parcel(parcelId)
    parcel.x = coordinates[0]
    parcel.y = coordinates[1]
    parcel.tokenId = event.params._landId
  }

  parcel.owner = event.params._destinatary.toHex()
  parcel.estate = null
  parcel.save()

  let estateHistory = new EstateHistory(
    getEstateHistoryId(event, 'RemoveLand', estateId)
  )
  estateHistory.estateId = null
  estateHistory.parcel = parcelId
  estateHistory.createdAt = event.block.timestamp
  estateHistory.save()
}

export function handleTransfer(event: Transfer): void {
  let id = event.params._tokenId.toString()
  let estate = new Estate(id)

  estate.owner = event.params._to.toHex()
  estate.operator = null
  estate.updateOperator = null
  estate.updatedAt = event.block.timestamp

  estate.save()

  createOwnership(
    AuthorizationType.OWNER,
    NFTType.ESTATE,
    EventType.TRANSFER,
    event,
    event.params._to,
    event.params._tokenId
  )

  createOwnership(
    AuthorizationType.OPERATOR,
    NFTType.ESTATE,
    EventType.TRANSFER,
    event,
    null,
    event.params._tokenId
  )

  createOwnership(
    AuthorizationType.UPDATE_OPERATOR,
    NFTType.ESTATE,
    EventType.TRANSFER,
    event,
    null,
    event.params._tokenId
  )

  createWallet(event.params._to)
}

export function handleApproval(event: Approval): void {
  let id = event.params._tokenId.toString()
  let estate = new Estate(id)

  estate.owner = event.params._owner.toHex()
  estate.operator = event.params._approved
  estate.updatedAt = event.block.timestamp
  estate.save()

  createOwnership(
    AuthorizationType.OPERATOR,
    NFTType.ESTATE,
    EventType.APPROVAL,
    event,
    event.params._approved,
    event.params._tokenId
  )
}

export function handleUpdateOperator(event: UpdateOperatorEvent): void {
  let id = event.params._estateId.toString()
  let estate = new Estate(id)

  estate.updateOperator = event.params._operator
  estate.updatedAt = event.block.timestamp
  estate.save()

  createOwnership(
    AuthorizationType.UPDATE_OPERATOR,
    NFTType.ESTATE,
    EventType.UPDATE_OPERATOR,
    event,
    event.params._operator,
    event.params._estateId
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
  authorization.owner = event.params._owner.toHex()
  authorization.operator = event.params._operator
  authorization.isApproved = event.params._approved
  authorization.save()

  createWallet(event.params._owner)
}

export function handleUpdate(event: Update): void {
  let id = event.params._assetId.toString()
  let data = event.params._data.toString()

  let estate = new Estate(id)

  let estateData = buildData(id, data, DataType.ESTATE)
  if (estateData != null) {
    estate.data = id
    estateData.save()
  }

  estate.save()
}
