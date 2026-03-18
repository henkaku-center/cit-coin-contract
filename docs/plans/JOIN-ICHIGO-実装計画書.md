# JOIN & ICHIGO トークン 実装計画書

**作成日**: 2026-03-18
**ステータス**: 計画中
**対象リポジトリ**: henkaku-center/cit-coin-contract
**チェーン**: Optimism (Mainnet / Sepolia Testnet)

---

## 1. 要件定義

### 1-1. JOINトークン（成績・学習の可視化トークン）

| 項目 | 値 |
|---|---|
| コントラクト名 | `JOIN` |
| トークン名 | JOIN |
| シンボル | JOIN |
| 仕様ベース | cJPY完全準拠（ERC20 + ERC20Burnable + AccessControl + Whitelistable） |
| 初期発行量 | 20,000,000 JOIN（18 decimals） |
| アローリスト | あり（Registryによるホワイトリスト制限） |
| 送り合い | 自由に可能（ホワイトリスト内） |
| 用途 | 学習活動の成績可視化、修了NFTミントの計算式に使用 |

### 1-2. ICHIGOトークン（コミュニティ内価値交換トークン）

| 項目 | 値 |
|---|---|
| コントラクト名 | `ICHIGO` |
| トークン名 | ICHIGO |
| シンボル | ICHIGO |
| 仕様ベース | cJPY完全準拠（JOINと完全同一仕様） |
| 初期発行量 | 20,000,000 ICHIGO（18 decimals） |
| アローリスト | あり（Registryによるホワイトリスト制限） |
| 送り合い | 自由に可能（ホワイトリスト内） |
| 用途 | コミュニティ内の価値交換・感謝・応援 |

### 1-3. 仕様比較

| 項目 | JOIN | ICHIGO |
|---|---|---|
| 仕様 | cJPY準拠 | cJPY準拠（JOINと完全同一） |
| 初期発行量 | 2,000万 | 2,000万 |
| アローリスト | あり | あり |
| 送り合い | 自由に可能 | 自由に可能 |
| 成績との関係 | 直接関係する | 無関係 |
| コンセプト | 成績・学習の可視化 | 価値交換・感謝・応援 |

> **補足**: 両トークンの送り合いは自由に可能とする。JOINの成績反映は運用レベルで管理し、コントラクト上の制限は設けない。

### 1-4. 管理権限ウォレット（両トークン共通）

| 名前 | アドレス |
|---|---|
| minta | `0x5bc1227ce82fd5a792031eab4756074140601dea` |
| spark | `0xec3c9c0a843365f596e7fb4c19738cfa2b3bb00d` |

両ウォレットに以下のロールを付与:
- `DEFAULT_ADMIN_ROLE`
- `MINTER_ROLE`
- `BURNER_ROLE`

---

## 2. アーキテクチャ

### 2-1. 既存cJPYコントラクトの構造（参考ベース）

```
cJPY.sol
├── ERC20 ('Chiba JPY', 'cJPY')
├── ERC20Burnable
├── AccessControl
│   ├── MINTER_ROLE → mint()
│   └── BURNER_ROLE → burn()
└── Whitelistable(Registry)
    └── _beforeTokenTransfer() → from/to 両方のホワイトリスト検証
```

### 2-2. 新トークンの設計方針

- **JOIN, ICHIGO ともに cJPY のコピー＆リネーム**（スペックに「新規実装ではなく既存の複製・改名で問題ない」と明記）
- 新規ロジックの追加は不要
- 追加発行が必要な場合は `MINTER_ROLE` 保持者が `mint()` を呼ぶだけで対応可能（既存設計）

### 2-3. Registry の共有方針

- JOIN と ICHIGO は**新しい Registry 1つを共有**する
- 既存prod環境の Registry（`0x9021e4Ed95Ea2157595C261c3DA318b75a6Dc156`）とは分離
  - 理由: 別年度の受講生を管理するため
- Registry に minta, spark を `DEFAULT_ADMIN_ROLE` として登録

### 2-4. コントラクト依存関係

```
Registry (依存なし)
  ├── JOIN (Registry に依存)
  ├── ICHIGO (Registry に依存)
  ├── LearnToEarn (Registry, JOIN に依存) ※必要に応じて
  ├── Faucet (Registry に依存) ※必要に応じて
  └── CitNFT (Registry, JOIN に依存) ※NFTミントサイト用
```

---

## 3. 実装フェーズ

### Phase 1: コントラクト作成

#### 3-1-1. `contracts/JOIN.sol` を新規作成

cJPY.sol をコピーし以下を変更:
- コントラクト名: `CJPY` → `JOIN`
- ERC20コンストラクタ: `ERC20('Chiba JPY', 'cJPY')` → `ERC20('JOIN', 'JOIN')`
- import文のWhitelistable参照はそのまま

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol';
import '@openzeppelin/contracts/access/AccessControl.sol';
import './Whitelistable.sol';

contract JOIN is ERC20, ERC20Burnable, AccessControl, Whitelistable {
  bytes32 public constant MINTER_ROLE = keccak256('MINTER_ROLE');
  bytes32 public constant BURNER_ROLE = keccak256('BURNER_ROLE');

  constructor(IRegistry registry) ERC20('JOIN', 'JOIN') Whitelistable(registry) {
    _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    _grantRole(MINTER_ROLE, msg.sender);
    _grantRole(BURNER_ROLE, msg.sender);
  }

  function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) ifWhitelisted(to) {
    _mint(to, amount);
  }

  function burn(uint256 amount) public override onlyRole(BURNER_ROLE) {
    super.burn(amount);
  }

  function _beforeTokenTransfer(address from, address to, uint256 amount) internal override {
    address[] memory toCheck = new address[](2);
    toCheck[0] = from;
    toCheck[1] = to;
    if (!_checkWhitelisted(toCheck)) revert NotWhitelisted();
    super._beforeTokenTransfer(from, to, amount);
  }
}
```

#### 3-1-2. `contracts/ICHIGO.sol` を新規作成

JOIN.sol と完全同一構造。変更箇所:
- コントラクト名: `ICHIGO`
- ERC20コンストラクタ: `ERC20('ICHIGO', 'ICHIGO')`

#### 3-1-3. `scripts/deploy.ts` を編集

`contractConfigs` 配列に以下を追加:

```typescript
{
  name: 'JOIN',
  ownable: false,
  args: [process.env.REGISTRY_ADDRESS as string],
},
{
  name: 'ICHIGO',
  ownable: false,
  args: [process.env.REGISTRY_ADDRESS as string],
},
```

#### 3-1-4. `scripts/mintJOIN.ts` を新規作成

mintCJPY.ts をベースに:
- コントラクト名: `JOIN`
- ミント量: `20,000,000` (20_000_000)
- 対象アドレス: `FUND_ADDRESS`

#### 3-1-5. `scripts/mintICHIGO.ts` を新規作成

mintJOIN.ts と同一構造で:
- コントラクト名: `ICHIGO`
- ミント量: `20,000,000` (20_000_000)

#### 3-1-6. `.env.example` を編集

以下の環境変数を追加:
```
JOIN_ADDRESS="0x0000000000000000000000000000000000000000"
ICHIGO_ADDRESS="0x0000000000000000000000000000000000000000"
```

#### 3-1-7. `package.json` にスクリプト追加

```json
"verify:join-test": "npx hardhat verify --network optimismSepolia --contract contracts/JOIN.sol:JOIN",
"verify:join": "npx hardhat verify --network optimism --contract contracts/JOIN.sol:JOIN",
"verify:ichigo-test": "npx hardhat verify --network optimismSepolia --contract contracts/ICHIGO.sol:ICHIGO",
"verify:ichigo": "npx hardhat verify --network optimism --contract contracts/ICHIGO.sol:ICHIGO",
"mint:testnet:join": "npx hardhat run scripts/mintJOIN.ts --network optimismSepolia",
"mint:mainnet:join": "npx hardhat run scripts/mintJOIN.ts --network optimism",
"mint:testnet:ichigo": "npx hardhat run scripts/mintICHIGO.ts --network optimismSepolia",
"mint:mainnet:ichigo": "npx hardhat run scripts/mintICHIGO.ts --network optimism",
"flatten:join": "npx hardhat flatten contracts/JOIN.sol > contracts/JOIN.flat.sol",
"flatten:ichigo": "npx hardhat flatten contracts/ICHIGO.sol > contracts/ICHIGO.flat.sol"
```

#### 3-1-8. テスト作成

- `test/JOIN.ts` - JOINトークンの単体テスト
- `test/ICHIGO.ts` - ICHIGOトークンの単体テスト

テスト項目:
- mint: MINTER_ROLE保持者のみ成功
- burn: BURNER_ROLE保持者のみ成功
- transfer: ホワイトリスト内アドレス間でのみ成功
- transfer: ホワイトリスト外アドレスへの送信は失敗
- AccessControl: ロール付与・剥奪

### Phase 2: コンパイル & ローカルテスト

```bash
yarn compile        # コンパイル確認
yarn test           # テスト実行
```

### Phase 3: テストネットデプロイ（Optimism Sepolia）

#### デプロイ手順

```bash
# 1. Registry デプロイ
yarn deploy:testnet  # → 4 (Registry) を選択
# .env に REGISTRY_ADDRESS を記録

# 2. JOIN デプロイ
yarn deploy:testnet  # → JOIN を選択
# .env に JOIN_ADDRESS を記録

# 3. ICHIGO デプロイ
yarn deploy:testnet  # → ICHIGO を選択
# .env に ICHIGO_ADDRESS を記録

# 4. JOIN 初期発行（20,000,000 JOIN）
yarn mint:testnet:join

# 5. ICHIGO 初期発行（20,000,000 ICHIGO）
yarn mint:testnet:ichigo
```

#### Verify 手順

```bash
yarn verify:registry-test <REGISTRY_ADDRESS>
yarn verify:join-test <JOIN_ADDRESS> <REGISTRY_ADDRESS>
yarn verify:ichigo-test <ICHIGO_ADDRESS> <REGISTRY_ADDRESS>
```

#### 権限設定（Etherscan Write Contract または スクリプト）

各トークンコントラクトに対して:
```
grantRole(DEFAULT_ADMIN_ROLE, 0x5bc1227ce82fd5a792031eab4756074140601dea)  # minta
grantRole(MINTER_ROLE,        0x5bc1227ce82fd5a792031eab4756074140601dea)  # minta
grantRole(BURNER_ROLE,        0x5bc1227ce82fd5a792031eab4756074140601dea)  # minta
grantRole(DEFAULT_ADMIN_ROLE, 0xec3c9c0a843365f596e7fb4c19738cfa2b3bb00d)  # spark
grantRole(MINTER_ROLE,        0xec3c9c0a843365f596e7fb4c19738cfa2b3bb00d)  # spark
grantRole(BURNER_ROLE,        0xec3c9c0a843365f596e7fb4c19738cfa2b3bb00d)  # spark
```

Registryに対して:
```
grantRoleAdmin(0x5bc1227ce82fd5a792031eab4756074140601dea)  # minta
grantRoleAdmin(0xec3c9c0a843365f596e7fb4c19738cfa2b3bb00d)  # spark
```

### Phase 4: 本番デプロイ（Optimism Mainnet）

Phase 3 と同じ手順を `--network optimism` / `mainnet` 系コマンドで実行。

---

## 4. ファイル変更一覧

| ファイル | 操作 | 説明 |
|---|---|---|
| `contracts/JOIN.sol` | 新規作成 | cJPY.sol のコピー＆リネーム |
| `contracts/ICHIGO.sol` | 新規作成 | cJPY.sol のコピー＆リネーム |
| `scripts/deploy.ts` | 編集 | contractConfigs に JOIN, ICHIGO 追加 |
| `scripts/mintJOIN.ts` | 新規作成 | 20,000,000 JOIN ミントスクリプト |
| `scripts/mintICHIGO.ts` | 新規作成 | 20,000,000 ICHIGO ミントスクリプト |
| `.env.example` | 編集 | JOIN_ADDRESS, ICHIGO_ADDRESS 追加 |
| `package.json` | 編集 | verify/mint/flatten スクリプト追加 |
| `test/JOIN.ts` | 新規作成 | JOINトークンのテスト |
| `test/ICHIGO.ts` | 新規作成 | ICHIGOトークンのテスト |

---

## 5. リスク・注意点

| リスク | レベル | 対策 |
|---|---|---|
| ガス代高騰（前回 Faucet で 200Gwei / $49 の事例あり） | HIGH | デプロイ時の Gas Price を確認。Optimism は通常 0.001 Gwei 以下で十分 |
| デプロイ用ウォレットの ETH 不足 | MEDIUM | 事前に十分な ETH を確保（デプロイ + mint + approve で複数トランザクション発生） |
| トランザクション失敗（過去に複数回発生） | MEDIUM | 失敗時はリトライ。Gas Limit を適切に設定 |
| NFTミント条件が未定 | LOW | CitNFT の `setPrice()` で後から設定可能。先行開発に影響なし |

---

## 6. 前回デプロイ時の教訓（prod環境ログより）

1. **デプロイ順序は厳守**: Registry → トークン → その他コントラクト
2. **各デプロイ後に `.env` を即更新**: 次のコントラクトが依存アドレスを参照するため
3. **Verify 時のコンストラクタ引数**: デプロイ時のコンソール出力を控えておく
4. **Registry の postDeploy**: ゼロアドレスと管理者アドレスをホワイトリストに追加
5. **mint 後の approve**: LearnToEarn コントラクトがトークンを transferFrom するため必要
6. **Faucet のガス代**: トランザクション Fee 用の ETH を別途確保しておく
