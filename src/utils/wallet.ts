import { BigInt, Address } from '@graphprotocol/graph-ts'
import { Wallet } from '../types/schema'

export function createWallet(id: Address): void {
  let wallet = Wallet.load(id.toHex())

  if (wallet == null) {
    wallet = new Wallet(id.toHex())
    wallet.address = id
  }

  wallet.save()
}
