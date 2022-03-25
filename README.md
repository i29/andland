# Ownership and permissions graph

A [graph](https://thegraph.com/legacy-explorer/subgraph/decentraland/land-manager) detaling the ownership and permissions of `LAND` and `Estate`s. It's used to make decisions about the historical ownership or permissions of a LAND or Estate.

For clarity, the rest of the file uses `Parcel` and `LAND` interchangeably, `Land`, refers to both `LAND` and `Estate`

## Index

- [Permission Types](#permission-types)
- [Entities](#entities)
- [Example Query](#example-query)
- [Run](#run)

## Permission types

There are two types of permissions, address-level and Land-level. Address level permissions are given by an address to another address, and grant you access to all of the Land of the recipient. Land level permissions grant you access to a particular Land.

For more information check the roles section of these proposal: https://github.com/decentraland/proposals/blob/master/dsp/dsp-0010/0010.md#roles

## Entities

You can check the graph entities in the [schema.graphql](https://github.com/decentraland/LAND-permissions-graph/blob/master/schema.graphql) file in this repo, or directly on the [graph's explorer](https://thegraph.com/legacy-explorer/subgraph/decentraland/land-manager). They are:

**Data related**

- [Parcel](#Parcel-and-Estate)
- [Estate](#Parcel-and-Estate)
- [Data](#Data)
- [Wallet](#Wallet)

**Permissions related**

- [EstateHistory](#EstateHistory)
- [Authorization](#Authorization): Address level
- [Owner](#Owner): Land level
- [Operator](#Operator-and-UpdateOperator): Land level
- [UpdateOperator](#Operator-and-UpdateOperator): Land level

### Parcel and Estate

These entities have information for all parcels (`LAND`) and estates (`Estate`) in Decentraland. Most of the information for each is self-evident, but there are a few interesting props:

```
Parcel {
	id: ID!
	(...)
	owner: Wallet
	owners: [Owner!]
	operators: [Operator!]
	operator: Bytes
	updateOperator: Bytes
	updateOperators: [UpdateOperator!]
	estate: Estate
	estates: [EstateHistory!]
}

Estate {
	id: ID!
	(...)
	owner: Wallet!
	owners: [Owner!]
	operators: [Operator!]
	operator: Bytes
	updateOperator: Bytes
	updateOperators: [UpdateOperator!]
}
```

For both `Parcel`s and `Estate`s the entity holds the current owner/operator/updateOperator, but also has a historical array consisting of [Owner](#Owner)s and [UpdateOperator](#Operator-and-UpdateOperator)s, so you don't necessarily have to query those entities separately.

Also, for parcels, you have a historical array of [EstateHistory](#EstateHistory) so you can check to which Estates the parcel belonged to, if any

### Data

The parsed data string for each parcel and estate

### Wallet

All addresses that have either a parcel or a estate in Decentraland

### EstateHistory

Has a tally **per parcel** of each Estate. The Entity allows you to check how many times a parcel was added or removed to an Estate and when. The data is timestamped to allow for historical queries, the last record by `createdAt` is the most recent.
The `ID` of each EstateHistory is composed of `{blockNumber}-{logIndex}-{type}-{estateId}`, where type is `AddLand` or `RemoveLand`. For example: `10004651-60-RemoveLand-1053`

Example query: Get the historical Estate data for the parcel (49,5)

```graphql
{
  estateHistories(
    where: { parcel: "0x31fffffffffffffffffffffffffffffffb" }
    orderBy: createdAt
    orderDirection: desc
  ) {
    id
    _prevEstateId
    estateId
    parcel {
      id
    }
    createdAt
  }
}
```

Result

```json
{
  "data": {
    "estateHistories": [
      {
        "id": "10005165-60-AddLand-3673",
        "_prevEstateId": "3673",
        "createdAt": "1588667501",
        "estateId": "3673"
      },
      {
        "id": "10004651-60-RemoveLand-1053",
        "_prevEstateId": null,
        "createdAt": "1588660675",
        "estateId": null
      },
      {
        "id": "6819309-55-AddLand-1053",
        "_prevEstateId": "1053",
        "createdAt": "1543851993",
        "estateId": "1053"
      }
    ]
  }
}
```

If you check those results, you can see that the parcel (`49,5`) was first added to the Estate `1053`, to then be removed and re-added to `3673`

### Authorization

Address-level permissions for Land, composed of [`UpdateManager`s](https://github.com/decentraland/proposals/blob/master/dsp/dsp-0010/0010.md#updatemanager) and [`ApprovalForAll`s](https://github.com/decentraland/proposals/blob/master/dsp/dsp-0010/0010.md#approvedforall). The data is timestamped to allow for historical queries, the last record by `createdAt` is the most recent.
The id of each Entity is composed of `{blockNumber}-{logIndex}-{type}` where type is Operator or Manager. The type is what let's you know which type of Authorization was given.

The Authorization type is not tied to a particular LAND or Estate, that is why it has the `tokenAddress` property, it'll refer to the EstateRegistry or LANDRegistry respectively, or maybe a new asset in the future. The `operator` prop is the address that received the Authorization

Example query: Get all the authorizations an address gave

```graphql
{
  authorizations(
    where: { owner: "0x1fc5616bb5cc9774c23b734a1a4e5ec82ebdc89a" }
  ) {
    id
    type
    tokenAddress
    operator
    isApproved
  }
}
```

Result

```json
{
  "data": {
    "authorizations": [
      {
        "id": "10033277-25-Operator",
        "isApproved": true,
        "operator": "0x8e5660b4ab70168b5a6feea0e0315cb49c8cd539",
        "tokenAddress": "0x959e104e1a4db6317fa58f8295f586e1a978c297",
        "type": "Operator"
      },
      {
        "id": "10033283-39-Operator",
        "isApproved": true,
        "operator": "0x8e5660b4ab70168b5a6feea0e0315cb49c8cd539",
        "tokenAddress": "0xf87e31492faf9a91b02ee0deaad50d51d56d5d4d",
        "type": "Operator"
      }
    ]
  }
}
```

This can be read as: The address `0x1fc5616bb5cc9774c23b734a1a4e5ec82ebdc89a` gave ApprovalForAll permissions to `0x8e5660b4ab70168b5a6feea0e0315cb49c8cd539` to manage both their LANDs (`0xf87e31492faf9a91b02ee0deaad50d51d56d5d4d`) and Estates (`0x959e104e1a4db6317fa58f8295f586e1a978c297`)

### Owner

Land-level permission, denotes [Ownership](https://github.com/decentraland/proposals/blob/master/dsp/dsp-0010/0010.md#owner) of each Land. The data is timestamped to allow for historical queries, the last record by `createdAt` is the most recent.
The id of each Entity is composed of `{blockNumber}-{logIndex}-{type}` where type is Owner. The prop `eventName` is here for completeness sake, as it's always a `Transfer`.

Example query: Get the historical owners for the parcel (-69,8)

```graphql
{
  owners(
    where: {
      parcel: "0xffffffffffffffffffffffffffffffbbfffffffffffffffffffffffffffffff8"
    }
    orderBy: createdAt
    orderDirection: desc
  ) {
    id
    address
    createdAt
  }
}
```

Result

```json
{
  "data": {
    "owners": [
      {
        "address": "0x8445165437cb63affb2f143378d0ec63e0249582",
        "createdAt": "1629829968",
        "id": "13089724-342-Owner"
      },
      {
        "address": "0x959e104e1a4db6317fa58f8295f586e1a978c297",
        "createdAt": "1629800297",
        "id": "13087436-356-Owner"
      },
      {
        "address": "0x8445165437cb63affb2f143378d0ec63e0249582",
        "createdAt": "1629677371",
        "id": "13078314-415-Owner"
      },
      {
        "address": "0xa01424b7540adbb792375dcf97b733a5d68ad347",
        "createdAt": "1629658902",
        "id": "13076890-172-Owner"
      },
      {
        "address": "0x3c0ccc803468f8b071fcc27b192752dabc625755",
        "createdAt": "1629657551",
        "id": "13076796-293-Owner"
      },
      {
        "address": "0x959e104e1a4db6317fa58f8295f586e1a978c297",
        "createdAt": "1618520212",
        "id": "12246972-138-Owner"
      },
      {
        "address": "0x3c0ccc803468f8b071fcc27b192752dabc625755",
        "createdAt": "1618154215",
        "id": "12219388-54-Owner"
      },
      {
        "address": "0x959e104e1a4db6317fa58f8295f586e1a978c297",
        "createdAt": "1544736107",
        "id": "6881249-31-Owner"
      },
      {
        "address": "0xf081eda01d8d3b10f6f93ff1459339b9ed174d3c",
        "createdAt": "1544040011",
        "id": "6832445-7-Owner"
      }
    ]
  }
}
```

The last owner on this result set, should always coincide with the `Parcel` entity `owner` prop. You could check it here by adding

```graphql
owners {
(...)
parcel {
	owner {
      id
    }
	}
}
```

to the query

### Operator and UpdateOperator

Land-level permissions, composed of [Operator](https://github.com/decentraland/proposals/blob/master/dsp/dsp-0010/0010.md#operator) and [UpdateOperator](https://github.com/decentraland/proposals/blob/master/dsp/dsp-0010/0010.md#updateoperator). These entities give you a clear idea of which address gave which permission, and to which Land. The data is timestamped to allow for historical queries, the last record by `createdAt` is the most recent.
The id of each Entity is composed of `{blockNumber}-{logIndex}-{type}` where type is Operator or UpdateOperator. You can check which type of event triggered the permission by getting the `eventName` prop, which could be:

- Approval: Grant/revoke operator permissions
- UpdateOperator: Grant/revoke update operator permissions
- Transfer: Reset permissions

Example query: Get the operator and update operator historical data for the (89,-139) parcel

```graphql
{
  operators(
    where: { parcel: "0x59ffffffffffffffffffffffffffffff75" }
    orderBy: createdAt
    orderDirection: desc
  ) {
    id
    eventName
    createdAt
  }
  updateOperators(
    where: { parcel: "0x59ffffffffffffffffffffffffffffff75" }
    orderBy: createdAt
    orderDirection: desc
  ) {
    id
    eventName
    createdAt
  }
}
```

Result

```json
{
  "data": {
    "operators": [
      {
        "address": null,
        "createdAt": "1629744158",
        "eventName": "Transfer",
        "id": "13083238-400-Operator"
      },
      {
        "address": "0x0000000000000000000000000000000000000000",
        "createdAt": "1629744158",
        "eventName": "Approval",
        "id": "13083238-399-Operator"
      },
      {
        "address": "0x30850bb479c4ef8dd2aa15d6a39462eaf216cd6f",
        "createdAt": "1629258936",
        "eventName": "Approval",
        "id": "13046956-229-Operator"
      },
      {
        "address": null,
        "createdAt": "1629192992",
        "eventName": "Transfer",
        "id": "13041944-92-Operator"
      },
      {
        "address": null,
        "createdAt": "1620570360",
        "eventName": "Transfer",
        "id": "12400678-87-Operator"
      },
      {
        "address": null,
        "createdAt": "1608891104",
        "eventName": "Transfer",
        "id": "11522180-318-Operator"
      },
      {
        "address": null,
        "createdAt": "1516578878",
        "eventName": "Transfer",
        "id": "4949132-43-Operator"
      }
    ],
    "updateOperators": [
      {
        "address": null,
        "createdAt": "1629744158",
        "eventName": "Transfer",
        "id": "13083238-400-UpdateOperator"
      },
      {
        "address": null,
        "createdAt": "1629192992",
        "eventName": "Transfer",
        "id": "13041944-92-UpdateOperator"
      },
      {
        "address": null,
        "createdAt": "1620570360",
        "eventName": "Transfer",
        "id": "12400678-87-UpdateOperator"
      },
      {
        "address": null,
        "createdAt": "1608891104",
        "eventName": "Transfer",
        "id": "11522180-318-UpdateOperator"
      },
      {
        "address": null,
        "createdAt": "1516578878",
        "eventName": "Transfer",
        "id": "4949132-43-UpdateOperator"
      }
    ]
  }
}
```

You can see in the results how the address is null on Transfers, as the Land-level persmissions are cleared

## Example Query

Get all permissions an address (`0x4fee7b061c97c9c496b01dbce9cdb10c02f0a0be`) has for a particular Land (`20,12`):

First we check the parcel itself, for the current Land-level permissions and to check if it's in a Estate:

```graphql
{
  parcels(where: { x: 20, y: 12 }) {
    id
    x
    y
    owner {
      id
    }
    operator
    updateOperator
    estate {
      id
    }
  }
}
```

Result:

```json
{
  "data": {
    "parcels": [
      {
        "id": "0x140000000000000000000000000000000c",
        "estate": null,
        "operator": "0x4fee7b061c97c9c496b01dbce9cdb10c02f0a0be",
        "owner": {
          "id": "0x7a536388147c04c5407ca6a7117141faa611bdde"
        },
        "updateOperator": null,
        "x": "20",
        "y": "12"
      }
    ]
  }
}
```

Here we can tell that:

- The Parcel does not belong to a Estate
- Our address is the operator of the Parcel

Next we have to check address level permissions, to do that, we have to check if the owner of the parcel, `0x7a536388147c04c5407ca6a7117141faa611bdde`, has given an [Authorization](#authorization) to it:

```graphql
{
  authorizations(
    where: {
      owner: "0x7a536388147c04c5407ca6a7117141faa611bdde"
      operator: "0x4fee7b061c97c9c496b01dbce9cdb10c02f0a0be"
      isApproved: true
    }
    orderBy: createdAt
    orderDirection: desc
  ) {
    id
    type
    tokenAddress
    operator
    isApproved
  }
}
```

Result:

```json
{
  "data": {
    "authorizations": [
      {
        "id": "12029389-231-Operator",
        "isApproved": true,
        "operator": "0x4fee7b061c97c9c496b01dbce9cdb10c02f0a0be",
        "tokenAddress": "0xf87e31492faf9a91b02ee0deaad50d51d56d5d4d",
        "type": "Operator"
      }
    ]
  }
}
```

We can see here that our operator has an Operator ([`ApprovalForAll`s](https://github.com/decentraland/proposals/blob/master/dsp/dsp-0010/0010.md#approvedforall)) permission for all LANDs (`0xf87e31492faf9a91b02ee0deaad50d51d56d5d4d`) our owner has.

**In conclusion**:

The address `0x4fee7b061c97c9c496b01dbce9cdb10c02f0a0be` is

- The operator of `(20,12)`
- Has all [`ApprovalForAll`s](https://github.com/decentraland/proposals/blob/master/dsp/dsp-0010/0010.md#approvedforall) permissions over `0x7a536388147c04c5407ca6a7117141faa611bdde` LAND. As long as `0x7a536388147c04c5407ca6a7117141faa611bdde` has `(20,12)`, she will have access.

## Run

```bash
npm run codegen
npm run build
npm run deploy
```
