# Cit Coin Contract

**Table Of Contents**:
- [Cit Coin Contract](#cit-coin-contract)
  - [Introduction \[ 序章 \]](#introduction--序章-)
  - [Contracts \[ コントラクツ \]](#contracts--コントラクツ-)
  - [Abstract Contracts](#abstract-contracts)
    - [Compiling Contracts:](#compiling-contracts)
    - [Deploying Contracts](#deploying-contracts)
    - [Verifying Contracts](#verifying-contracts)
      - [1. Verifying `Registry` Contract](#1-verifying-registry-contract)
      - [2. Verifying `cJPY` Contract](#2-verifying-cjpy-contract)
      - [3. Verifying `LearnToEarn` Contract](#3-verifying-learntoearn-contract)


## Introduction [ 序章 ]

The Cit-Coin project is a Hardhat Project that complies with EVM-based decentralized application that facilitates students to learn and earn a cryptocurrency.

Cit-Coin プロジェクトは、ハードハット プロジェクトに準拠した EVM ベースの分散型アプリケーションであり、学生が簡単に仮想通貨を学び、獲得できるようにします。

## Contracts [ コントラクツ ]

1. `Registry`
2. `cJPY` [ CIT Coin コントラクツ ]
3. `LearnToEarn` [ Learn To Earn コントラクツ ]
4. `CitNFT`
5. `Faucet`

## Abstract Contracts

1. `Ownable`
2. `Whitelistable`

### Compiling Contracts:

We can easily compile the contracts using the `compile` scripts mentioned in the `package.json` file.

`package.json` ファイルに記載されている `compile` スクリプトを使用して、コントラクトを簡単にコンパイルできます。

```shell
yarn compile
```

### Deploying Contracts

To deploy contracts, we need to run `yarn deploy:mainnet` or `yarn deploy:testnet`
command which will use the interactive shell to select options if not used in
the environment variable.

```shell

# Deploying contracts in the testnet

yarn deploy:testnet

Please select one of the contracts below:

0. CitNFT
1. CJPY
2. Faucet
3. LearnToEarn
4. Registry

Select The Contract to deploy [Eg: 1]: 1

Deploying Contract with the following configuration:
{
  name: 'CJPY',
  ownable: false,
  args: [ '0x071AF28249749a53245057aBD9cd8f1ea488eABB' ]
}
======================================================================
  Contract Address:  0xFF38186A92373C41CDCcD98F414Aa2fBA346653D
======================================================================

```

### Verifying Contracts

While verifying contracts, we need an `address` of the deployed contract
and other arguments if needed by the contract.

The Contract first needs to be deployed before verifying. Sometimes, one contract
requires another contract to be deployed before verifying that contract.

For example: `cJPY` needs `Registry` to be deployed so that it can be passed in
the constructor arguments.


> **Note**: you must add `PRIVATE_KEY` to an environment variable or `.env`
> file to be able to verify the contract.


#### 1. Verifying `Registry` Contract

```bash
# verifying on testnet
yarn verify:registry-test <REGISTRY_CONTRACT_ADDRESS>

# verifying on mainnet
yarn verify:registry <REGISTRY_CONTRACT_ADDRESS>

# Example
yarn verify:registry 0x071AF28249749a53245057aBD9cd8f1ea488eABB
```

#### 2. Verifying `cJPY` Contract
This contract first needs to be deployed

```bash
# verifying on testnet
yarn verify:cjpy-test <CONTRACT_ADDRESS> <REGISTRY_ADDRESS>

# verifying on mainnet
yarn verify:cjpy <CONTRACT_ADDRESS> <REGISTRY_ADDRESS>

# Example:
yarn verify:cjpy-test 0xFF38186A92373C41CDCcD98F414Aa2fBA346653D 0x071AF28249749a53245057aBD9cd8f1ea488eABB
```

#### 3. Verifying `LearnToEarn` Contract
To verify this Contract, we must provide 3 different addresses as arguments to the
`yarn verify` command.

1. Address of the deployed contract
2. Address of `registry`
3. Address of `cJPY`
4. Fund Address

```bash
# verifying on testnet
yarn verify:learn-test <CONTRACT_ADDRESS> <CJPY_ADDRESS> <FUND_ADDRESS>

# verifying on mainnet
yarn verify:learn <CONTRACT_ADDRESS> <CJPY_ADDRESS> <FUND_ADDRESS>

# Example:
yarn verify:learn-test 0xD37A8C0789aE9690b0881668E0D12aEAf75773e4 0x071AF28249749a53245057aBD9cd8f1ea488eABB 0xFF38186A92373C41CDCcD98F414Aa2fBA346653D 0x137ea0e26414eb73BB08e601E28072781962f810
```

**Similar Commands**

```shell
yarn node
yarn test
yarn
```
