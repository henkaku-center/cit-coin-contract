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
      - [4. Verifying `Faucet` Contract](#4-verifying-faucet-contract)
      - [4. Verifying `NFT` Contract](#4-verifying-nft-contract)
  - [Other Commands](#other-commands)


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

Select The Contract to deploy [Eg: 1]:  2
2
Deploying Contract with the following configuration:
{
  name: 'Faucet',
  ownable: true,
  args: [
    '0x071AF28249749a53245057aBD9cd8f1ea488eABB',
    '0x137ea0e26414eb73BB08e601E28072781962f810'
  ]
}
======================================================================
  Contract Address:  0x0E4587481c947f0aad33143e8b55E06f118036ac
======================================================================

```

### Verifying Contracts

While verifying contracts, we need an `address` of the deployed contract
and other arguments if needed by the contract.

The Contract first needs to be deployed before verifying. Sometimes, one contract
requires another contract to be deployed before verifying that contract.

For example: `cJPY` needs `Registry` to be deployed so that it can be passed in
the constructor arguments.

> **NOTE**: The arguments that are printed in the interactive console will be
> required while verifying the contracts. We can simply scroll the shell up to
> see the arguments that were passed to deploy the contract.
>
> example: for `Faucet`, the console output looks like below:
> ```shell
>    Select The Contract to deploy [Eg: 1]:  2
>    2
>    Deploying Contract with the following configuration:
>    {
>    name: 'Faucet',
>    ownable: true,
>    args: [
>        '0x071AF28249749a53245057aBD9cd8f1ea488eABB',
>        '0x137ea0e26414eb73BB08e601E28072781962f810'
>    ]
>    }
>    ======================================================================
>    Contract Address:  0x0E4587481c947f0aad33143e8b55E06f118036ac
>    ======================================================================
> ```
> This means the verify command also needs the following addresses:
> - `contract address`: `0x0E4587481c947f0aad33143e8b55E06f118036ac`
> - `args[0]`: `0x071AF28249749a53245057aBD9cd8f1ea488eABB`
> - `args[1]`: `0x137ea0e26414eb73BB08e601E28072781962f810`



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
To verify this Contract, we must provide 4 different addresses as arguments to the
`yarn verify` command.

1. Address of the deployed contract
2. Address of `registry`
3. Address of `cJPY`
4. Fund Address

```bash
# verifying on testnet
yarn verify:learn-test <CONTRACT_ADDRESS> <REGISTRY_ADDRESS> <CJPY_ADDRESS> <FUND_ADDRESS>

# verifying on mainnet
yarn verify:learn <CONTRACT_ADDRESS> <REGISTRY_ADDRESS> <CJPY_ADDRESS> <FUND_ADDRESS>

# Example:
yarn verify:learn-test 0xD37A8C0789aE9690b0881668E0D12aEAf75773e4 0x071AF28249749a53245057aBD9cd8f1ea488eABB 0xFF38186A92373C41CDCcD98F414Aa2fBA346653D 0x137ea0e26414eb73BB08e601E28072781962f810
```

#### 4. Verifying `Faucet` Contract
To verify this Contract, we must provide 3 different addresses as arguments to the
`yarn verify` command.

1. Address of the deployed contract
2. Address of `registry`
4. Fund Address

```bash
# verifying on testnet
yarn verify:faucet-test <CONTRACT_ADDRESS> <REGISTRY_ADDRESS> <FUND_ADDRESS>

# verifying on mainnet
yarn verify:faucet <CONTRACT_ADDRESS> <REGISTRY_ADDRESS> <FUND_ADDRESS>

# Example:
yarn verify:faucet-test 0x0E4587481c947f0aad33143e8b55E06f118036ac 0x071AF28249749a53245057aBD9cd8f1ea488eABB 0x137ea0e26414eb73BB08e601E28072781962f810
```

#### 4. Verifying `NFT` Contract
To verify this Contract, we must provide 3 different addresses as arguments to the
`yarn verify` command.

1. Address of the deployed contract
2. Address of `registry`
4. Address of `cJPY`

```bash
# verifying on testnet
yarn verify:nft-test <CONTRACT_ADDRESS> <REGISTRY_ADDRESS> <CJPY_ADDRESS>

# verifying on mainnet
yarn verify:nft <CONTRACT_ADDRESS> <REGISTRY_ADDRESS> <CJPY_ADDRESS>

# Example:
yarn verify:nft-test 0x40d5cec4aE77Cbb67bce73b8894B6508329B414F 0x071AF28249749a53245057aBD9cd8f1ea488eABB 0xFF38186A92373C41CDCcD98F414Aa2fBA346653D
```

## Other Commands

```shell
yarn node
yarn test
yarn
```
