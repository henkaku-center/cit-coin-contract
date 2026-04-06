# ICHIGO / JOIN トークン テストネットデプロイ手順書

## 概要

ICHIGO および JOIN トークン（ERC20）を Optimism Sepolia テストネットにデプロイする手順。

- **ネットワーク**: Optimism Sepolia (Chain ID: 11155420)
- **RPC URL**: `https://sepolia.optimism.io`
- **Explorer**: https://sepolia-optimistic.etherscan.io

## 前提条件

- Node.js (v18 以上)
- Yarn パッケージマネージャー
- Optimism Sepolia の ETH（ガス代用）
  - [Optimism Sepolia Faucet](https://www.alchemy.com/faucets/optimism-sepolia) 等で取得
- デプロイ用ウォレットの秘密鍵
- Optimism Etherscan API キー（コントラクト検証用）
- **Registry コントラクトが既にデプロイ済みであること**

## 手順

### 1. 依存パッケージのインストール

```bash
yarn install
```

### 2. 環境変数の設定

`.env.example` をコピーして `.env` を作成し、値を設定する。

```bash
cp .env.example .env
```

| 変数名 | 説明 | 必須 |
|--------|------|------|
| `PRIVATE_KEY` | デプロイ用ウォレットの秘密鍵 | Yes |
| `REGISTRY_ADDRESS` | デプロイ済み Registry コントラクトのアドレス | Yes |
| `GNOSIS_OWNER` | Gnosis Safe マルチシグのアドレス | Yes |
| `FUND_ADDRESS` | トークンのミント先アドレス | Yes |
| `OPTIMISM_ETHERSCAN_API_KEY` | Etherscan API キー（verify 用） | Yes |

### 3. コントラクトのコンパイル

```bash
yarn compile
```

エラーなくコンパイルが完了することを確認。

### 4. テストの実行

デプロイ前に必ずテストを通す。

```bash
yarn test:join
yarn test:ichigo
```

### 5. JOIN トークンのデプロイ

```bash
yarn deploy:testnet
```

対話プロンプトが表示されるので、`2` を入力（JOIN を選択）。

```
0. CitNFT
1. CJPY
2. JOIN
3. ICHIGO
4. Faucet
5. LearnToEarn
6. Registry

Select The Contract to deploy [Eg: 1]:  2
```

デプロイ完了後、表示されるコントラクトアドレスを `.env` の `JOIN_ADDRESS` に記録する。

```
======================================================================
  Contract Address:  0x...
======================================================================
```

### 6. ICHIGO トークンのデプロイ

```bash
yarn deploy:testnet
```

対話プロンプトで `3` を入力（ICHIGO を選択）。

デプロイ完了後、コントラクトアドレスを `.env` の `ICHIGO_ADDRESS` に記録する。

### 7. コントラクトの検証（Verify）

Etherscan 上でソースコードを検証する。

```bash
yarn verify:join-test <JOIN_ADDRESS> <REGISTRY_ADDRESS>
yarn verify:ichigo-test <ICHIGO_ADDRESS> <REGISTRY_ADDRESS>
```

`<JOIN_ADDRESS>` と `<ICHIGO_ADDRESS>` はデプロイ時に取得したアドレス、`<REGISTRY_ADDRESS>` はコンストラクタ引数として渡した Registry のアドレスに置き換える。

検証成功後、Etherscan のコントラクトページで緑のチェックマークが表示される。

### 8. トークンのミント

`.env` に以下が設定されていることを確認してから実行する。

- `JOIN_ADDRESS` / `ICHIGO_ADDRESS`（手順 5, 6 で取得）
- `FUND_ADDRESS`（ミント先）
- `LEARN_TO_WARN_ADDRESS`（LearnToEarn コントラクトアドレス）

```bash
yarn mint:testnet:join
yarn mint:testnet:ichigo
```

各トークンが 20,000,000 トークン発行され、`FUND_ADDRESS` にミントされる。
同時に LearnToEarn コントラクトへの approve も実行される。

### 9. デプロイ結果の確認

Etherscan でコントラクトの状態を確認する。

- **JOIN**: `https://sepolia-optimistic.etherscan.io/address/<JOIN_ADDRESS>`
- **ICHIGO**: `https://sepolia-optimistic.etherscan.io/address/<ICHIGO_ADDRESS>`

確認項目:
- [ ] コントラクトが正しいネットワークにデプロイされている
- [ ] ソースコードが検証済み（Verified）
- [ ] トークン名・シンボルが正しい（JOIN / ICHIGO）
- [ ] ミントされたトークン量が正しい（20,000,000）
- [ ] ロール（MINTER_ROLE, BURNER_ROLE）がデプロイヤーに付与されている

## トラブルシューティング

### ガス不足エラー

Optimism Sepolia の ETH 残高を確認。Faucet から追加取得する。

### `REGISTRY_ADDRESS is not set`

`.env` に `REGISTRY_ADDRESS` が設定されているか確認。Registry コントラクトが未デプロイの場合は、先に Registry をデプロイする（deploy スクリプトで `6` を選択）。

### Verify が失敗する

- `OPTIMISM_ETHERSCAN_API_KEY` が正しいか確認
- コンストラクタ引数が正しいか確認
- デプロイ直後は Etherscan のインデックスが追いついていない場合があるので、数分待ってからリトライ

### ミントが `NotWhitelisted` で失敗する

`FUND_ADDRESS` が Registry のホワイトリストに登録されているか確認。未登録の場合は Registry コントラクトの `bulkAddToWhitelist` で追加する。

## デプロイ順序まとめ

```
1. Registry（未デプロイの場合）
2. JOIN
3. ICHIGO
4. Verify（JOIN, ICHIGO）
5. Mint（JOIN, ICHIGO）
```
