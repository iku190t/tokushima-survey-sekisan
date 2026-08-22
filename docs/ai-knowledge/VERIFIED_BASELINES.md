# 検証済みベースライン

## B-2026-08-22-01

- 状態: **検証済み**
- 検証日: 2026-08-22
- 種別: Git未導入の作業ディレクトリ・スナップショット
- コミット: なし
- 用途: Gitコミットが作成されるまでの正常比較基準

### 合格した試験

```text
OK: regulation audit checks passed (master mapping, precision, quantity formulas, travel, rounding, overhead)
OK: MLIT official role price presets R4-R8
OK: UI static wiring checks passed
```

実行対象:

```text
node tests/test-engine.js
node tests/test-role-prices.js
node tests/test-ui-static.js
```

### SHA-256

| ファイル | SHA-256 |
|---|---|
| `index.html` | `E5E32D3FDF67E91E23882489B8ABD1B98F30A7A1AFA8D291EDE7C3598B298124` |
| `app.js` | `628B3E8A09D128D15990314DBAF7B07041E21412DDEEED9C9742453B4206BCC7` |
| `engine.js` | `7069414ACDE68070D15C3BEB64A51352091E66F8DC7B788EDCA18B7DFD605524` |
| `styles.css` | `1A92FD86B17AAE0E9DA02B48755C1E76CB89562379B72F79678E3E18390D79CE` |
| `data/master-r8.js` | `87E2E56CF5B13379B7E7E960C5E9227E54539AB327C07EE5787856497C921005` |
| `data/official-role-prices.js` | `B846FB7B3654DC82AFFB0559D0322686DBC2987FB5ADF50DA64A36094E4B5558` |
| `tests/test-engine.js` | `468A08020C4D05740EACD7AF1521F71F01D79693EF64752681FA78924912E370` |
| `tests/test-role-prices.js` | `3B9B9CD3D3E434B5AB1242218E45D6556E06C48064699AACA6B5B37B60AD8AED` |
| `tests/test-ui-static.js` | `C2021BF334E3E558B07E7DD04C301C9D887B5B8A3401B118BC95B3CA3D4522E9` |

### このベースラインが保証する範囲

- 上記3試験が検査する計算・単価・静的UI結線が合格したこと。
- 上記ハッシュのファイル群が検証時と同一であること。

### 保証しない範囲

- 全134項目の全条件組合せが正しいこと。
- 案件固有条件を含む最終契約金額の一致。
- 実ブラウザーでの全操作と全PDFページの目視品質。
- 令和4～7年度の完全な歩掛・経費率マスター。

次回、正常コミットを作成する明示的依頼があった場合は、試験結果とコミットIDを新しいベースラインとして追加し、本項目は廃止せず履歴として残す。

## B-2026-08-22-02

- 状態: **検証済み**
- 検証日: 2026-08-22
- コミット: `2fcd20415dc5a116e69d8a30311fd3ffcb724afb`
- ブランチ: `main`
- 公開リポジトリ: `https://github.com/iku190t/tokushima-survey-sekisan`
- 内容: 初回Git公開版。起動時は新規画面、前回データは明示操作で復元する。

### 合格した試験

```text
OK: regulation audit checks passed (master mapping, precision, quantity formulas, travel, rounding, overhead)
OK: MLIT official role price presets R4-R8
OK: UI static wiring checks passed
```

### 主要ファイルのSHA-256

| ファイル | SHA-256 |
|---|---|
| `index.html` | `C10A918B7D243FFA49D1BC18D8CD027D0823233D2862C8C88C86D0C44933D6FC` |
| `app.js` | `9FBFBC8A7C6114FC81D89A94ECBF5D6E2C2A4E9107E5CBDA768FD849D40BA0CB` |
| `engine.js` | `7069414ACDE68070D15C3BEB64A51352091E66F8DC7B788EDCA18B7DFD605524` |
| `styles.css` | `0F8E580A93D7B8B2E44C6E9A4427B0ABE54529E34B3A83BB921C9109C72E5A70` |
| `data/master-r8.js` | `87E2E56CF5B13379B7E7E960C5E9227E54539AB327C07EE5787856497C921005` |
| `data/official-role-prices.js` | `B846FB7B3654DC82AFFB0559D0322686DBC2987FB5ADF50DA64A36094E4B5558` |
| `tests/test-engine.js` | `468A08020C4D05740EACD7AF1521F71F01D79693EF64752681FA78924912E370` |
| `tests/test-role-prices.js` | `3B9B9CD3D3E434B5AB1242218E45D6556E06C48064699AACA6B5B37B60AD8AED` |
| `tests/test-ui-static.js` | `BA45B71E5C904C7C9366F7920EA33F79E2A3C64472FCD9D40565237903F7E136` |

### 検証範囲

- 計算、年度単価、静的UI結線が合格した。
- 起動時の新規初期化、復元ボタン、未操作時の保存抑止は静的試験で確認した。
- 実ブラウザーでの復元操作と全PDFの目視確認は未検証であり、`TEST_MATRIX.md` の手動試験に残す。

## B-2026-08-22-03

- 状態: **検証済み**
- 検証日: 2026-08-22
- コミット: `a7896aaa18fa8e428f620140f931418ad6a1402f`
- ブランチ: `main`
- 内容: 制作者・ブランド表示、OFUSE応援導線、参考試算の免責表示、同意式Google Analyticsを追加した公開候補版。

### 合格した試験

```text
OK: regulation audit checks passed (master mapping, precision, quantity formulas, travel, rounding, overhead)
OK: MLIT official role price presets R4-R8
OK: UI static wiring checks passed
```

追加構文検査:

```text
node --check app.js
node --check analytics.js
```

### 主要ファイルのSHA-256

| ファイル | SHA-256 |
|---|---|
| `index.html` | `FD42131C571ED1DE8DB9AAB9F3A2755D0E51F2EAEC6B391B25E14F68BF31E226` |
| `app.js` | `814981FC3D65D3AACEB6DBAE48D210E9C2F98B43FA48E1F7D5A1612AF72D1DB6` |
| `analytics.js` | `2370209BBE93A483B2BBFB083641859EBF8A485B2BE7238E00740E4DE01C7CBA` |
| `engine.js` | `7069414ACDE68070D15C3BEB64A51352091E66F8DC7B788EDCA18B7DFD605524` |
| `styles.css` | `034D713B2E6F4334A3083453B481154C23714DAC192E104AC639DFFE8307B641` |
| `DISCLAIMER.md` | `3854105C044D266A3FB042A9918B4BCDD8E4A496EFEC75D3CC56528C512A6F7B` |
| `data/master-r8.js` | `87E2E56CF5B13379B7E7E960C5E9227E54539AB327C07EE5787856497C921005` |
| `data/official-role-prices.js` | `B846FB7B3654DC82AFFB0559D0322686DBC2987FB5ADF50DA64A36094E4B5558` |
| `tests/test-engine.js` | `468A08020C4D05740EACD7AF1521F71F01D79693EF64752681FA78924912E370` |
| `tests/test-role-prices.js` | `3B9B9CD3D3E434B5AB1242218E45D6556E06C48064699AACA6B5B37B60AD8AED` |
| `tests/test-ui-static.js` | `DA6FFAD7C2BD180828A7B61DA155058FC5D8E6A6E7FFB1ECAD1F0731D5F636C1` |

### 検証範囲

- 既存の計算、過去年度技術者単価、数量・帳票結線を壊していないことを3試験で確認した。
- 制作者、ブランド、OFUSE、免責ダイアログ、帳票注意書き、Analytics同意UIとプライバシー制限の静的結線を確認した。
- `app.js`に`gtag`呼出しがなく、積算入力値を解析イベントへ送る実装がないことを静的試験で確認した。
- 公開HTTPS版での表示・同意操作・GA管理画面への着信は未検証であり、`M-PUBLIC-01`に残す。

## B-2026-08-22-04

- 状態: **検証済み**
- 検証日: 2026-08-22
- コミット: `d516af2c8ca72d6a9c4a7acd7afcc718c95a37c7`
- ブランチ: `main`
- 公開URL: `https://iku190t.github.io/tokushima-survey-sekisan/`
- 内容: B-2026-08-22-03に、公開アセットの版番号、スマートフォン用タブ折返し、積算表のレイアウト封じ込めを追加した公開版。

### 合格した自動試験

```text
OK: regulation audit checks passed (master mapping, precision, quantity formulas, travel, rounding, overhead)
OK: MLIT official role price presets R4-R8
OK: UI static wiring checks passed
```

### 公開HTTPS版の実ブラウザー確認

- 制作者・ブランド、参考試算表示、免責ダイアログ、公式サイト、OFUSE、Analytics同意UIを確認した。
- Analyticsの「許可しない」を選択し、再読込み後に同意UIが再表示されないことを確認した。
- 幅390pxで本文幅375px、タブ2段折返し、積算表表示枠345px・内部内容505pxを確認した。
- Analyticsの「許可する」とGA管理画面への着信は、閲覧情報を外部送信するため自動試験していない。
- 自動計測上のルート`scrollWidth`は485pxであり、スマートフォン実機でのページ根元の横移動確認は未完了である。

### 主要ファイルのSHA-256

| ファイル | SHA-256 |
|---|---|
| `index.html` | `34C1101CFD1C7FEEEDCE022686232F694FA4B0F43BB7CA897DAC77E3075C3571` |
| `app.js` | `814981FC3D65D3AACEB6DBAE48D210E9C2F98B43FA48E1F7D5A1612AF72D1DB6` |
| `analytics.js` | `2370209BBE93A483B2BBFB083641859EBF8A485B2BE7238E00740E4DE01C7CBA` |
| `engine.js` | `7069414ACDE68070D15C3BEB64A51352091E66F8DC7B788EDCA18B7DFD605524` |
| `styles.css` | `C3AB22B6A8D4719313F0B5774AA63AE15159CA3C644D20A8DECC9301977868A0` |
| `DISCLAIMER.md` | `3854105C044D266A3FB042A9918B4BCDD8E4A496EFEC75D3CC56528C512A6F7B` |
| `tests/test-ui-static.js` | `8A543AE8612E175D9DBB0133D7D191D34CB2C22059B687A007A6D35AF2F18CEA` |
