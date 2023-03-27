# Cit Coin Contract

## Introduction [ 序章 ]

The Cit-Coin project is a Hardhat Project that complies with EVM-based decentralized application that facilitates students to learn and earn a cryptocurrency.

Cit-Coin プロジェクトは、ハードハット プロジェクトに準拠した EVM ベースの分散型アプリケーションであり、学生が簡単に仮想通貨を学び、獲得できるようにします。

## Contracts [ コントラクツ ]

1. CIT Coin Contract [ CIT Coin コントラクツ ]
2. Learn To Earn Contract [ Learn To Earn コントラクツ ]

### Compiling Contracts:

We can easily compile the contracts using the `compile` scripts mentioned in the `package.json` file.

`package.json` ファイルに記載されている `compile` スクリプトを使用して、コントラクトを簡単にコンパイルできます。

```shell
yarn compile
```

### Deploying Contracts

To deploy contracts, we need to run `yarn deploy` command.

```shell

# deploying Cit Coin and Learn to Earn in the testnet
yarn deploy:cit-coin-test
yarn deploy:learn-test

# deploying Cit Coin and Learn to Earn in the mainnet
yarn deploy:cit-coin
yarn deploy:learn
```

### Verifying Contracts

To verify Contract, we must provide 3 different addresses as arguments to the
`yarn verify` command.
1. Address of the deployed contract
2. Address of the CIT Coin
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