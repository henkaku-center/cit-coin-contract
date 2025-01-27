# Cit Coin Contract

**Table Of Contents**:
- [Cit Coin Contract](#cit-coin-contract)
  - [Introduction \[ 序章 \]](#introduction--序章-)
  - [Contracts \[ コントラクツ \]](#contracts--コントラクツ-)
  - [Abstract Contracts](#abstract-contracts)
    - [Compiling Contracts:](#compiling-contracts)
    - [Deploying Contracts](#deploying-contracts)
    - [Verifying Contracts](#verifying-contracts)


## Introduction [ 序章 ]

The Cit-Coin project is a Hardhat Project that complies with EVM-based decentralized application that facilitates students to learn and earn a cryptocurrency.

Cit-Coin プロジェクトは、ハードハット プロジェクトに準拠した EVM ベースの分散型アプリケーションであり、学生が簡単に仮想通貨を学び、獲得できるようにします。

## Contracts [ コントラクツ ]

1. `cJPY` [ CIT Coin コントラクツ ]
2. `LearnToEarn` [ Learn To Earn コントラクツ ]
3. `CitNFT`
4. `Faucet`

## Abstract Contracts

1. `Ownable`
2. `Registry`
3. `Whitelistable`

### Compiling Contracts:

We can easily compile the contracts using the `compile` scripts mentioned in the `package.json` file.

`package.json` ファイルに記載されている `compile` スクリプトを使用して、コントラクトを簡単にコンパイルできます。

```shell
yarn compile
```

### Deploying Contracts

To deploy contracts, we need to run `yarn deploy` command.

```shell

# Deploying `cJPY` and `LearnToEarn` in the testnet

yarn deploy:cjpy
yarn deploy:learn-test

# deploying `cJPY` and `LearnToEarn` in the mainnet
yarn deploy:cjpy
yarn deploy:learn
```

### Verifying Contracts

To verify Contract, we must provide 3 different addresses as arguments to the
`yarn verify` command.

1. Address of the deployed contract
2. Address of `cJPY`
3. Fund Address

> **Note**: you must add `PRIVATE_KEY` to an environment variable or `.env`
> file to be able to verify the contract.

```shell

yarn verify:learn-test 0xE1518892F9A3AF85B7a208323ed69F644bDE12b5 0x6631420dDA4C985657D008F71f36850fD70e5Ad9 0x137ea0e26414eb73BB08e601E28072781962f810

```

**Similar Commands**

```shell
yarn node
yarn test
yarn
```
