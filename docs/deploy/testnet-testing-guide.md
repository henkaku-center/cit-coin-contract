# JOIN / ICHIGO トークン テスト依頼書

## 概要

JOIN および ICHIGO トークンを Optimism Sepolia テストネットにデプロイしました。
各自のウォレットにテスト用トークンを送付済みです。動作確認をお願いします。

## ネットワーク情報（MetaMask に追加）

| 項目 | 値 |
|---|---|
| ネットワーク名 | Optimism Sepolia |
| RPC URL | `https://sepolia.optimism.io` |
| チェーン ID | `11155420` |
| 通貨シンボル | `ETH` |
| ブロックエクスプローラー | `https://sepolia-optimistic.etherscan.io` |

## トークン情報（MetaMask にインポート）

MetaMask でトークンを表示するには、手動でインポートが必要です。

### インポート手順

1. MetaMask を開き、ネットワークが **Optimism Sepolia** になっていることを確認
2. 「トークン」タブ下部の **「トークンをインポート」** をクリック
3. 「トークンコントラクトアドレス」に以下を貼り付け
4. シンボル・デシマルが自動入力されたら **「追加」** をクリック

| トークン | コントラクトアドレス | デシマル |
|---|---|---|
| JOIN | `0x65A478166a19b07cdc4a15C55437118062a1A1A1` | 18 |
| ICHIGO | `0xBe8Fa0747851c3B986c115F43aBC3FCB14988ADA` | 18 |

## 送付済みトークン

| 名前 | アドレス | JOIN | ICHIGO |
|---|---|---|---|
| minta | `0x5bc1227ce82fd5a792031eab4756074140601dea` | 1,000 | 1,000 |
| spark | `0xec3c9c0a843365f596e7fb4c19738cfa2b3bb00d` | 1,000 | 1,000 |

## テスト項目

以下の動作確認をお願いします。

### 1. トークン残高の確認

- [ ] MetaMask で JOIN が 1,000 と表示される
- [ ] MetaMask で ICHIGO が 1,000 と表示される

### 2. トークンの送り合いテスト

minta ⇔ spark 間でトークンを送り合ってください。

- [ ] JOIN を相手に送信できる（例: 10 JOIN）
- [ ] ICHIGO を相手に送信できる（例: 10 ICHIGO）
- [ ] 送信後、残高が正しく反映される

### 3. Etherscan での確認

以下のリンクからトランザクション履歴を確認できます。

- JOIN: https://sepolia-optimistic.etherscan.io/address/0x65A478166a19b07cdc4a15C55437118062a1A1A1
- ICHIGO: https://sepolia-optimistic.etherscan.io/address/0xBe8Fa0747851c3B986c115F43aBC3FCB14988ADA

### 4. 管理機能のテスト（任意）

Etherscan の「Write Contract」からも操作可能です（要 MetaMask 接続）。

- [ ] `mint`: 新しいトークンを発行できる
- [ ] `burn`: 自分のトークンを焼却できる
- [ ] `grantRole` / `revokeRole`: ロールの付与・剥奪ができる

## ガス代について

テストネットの ETH が必要です。お持ちでない場合は以下から取得してください。

- Superchain Faucet: https://app.optimism.io/faucet（GitHub 認証）
- Chainlink Faucet: https://faucets.chain.link/opt-sepolia（メール認証）

## 問題があった場合

以下の情報とともに報告してください。

- 実行した操作
- エラーメッセージ（あれば）
- トランザクションハッシュ（あれば）
