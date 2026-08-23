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

## B-2026-08-22-05

- 状態: **検証済み**
- 検証日: 2026-08-22
- コミット: `01868130ed1a35ecc29b774082660456403377f5`
- ブランチ: `main`
- 公開URL: `https://iku190t.github.io/tokushima-survey-sekisan/`
- 内容: 参考画像のEz Viewer型表示に合わせ、「Ez積算／制作：株式会社アイズ測量」の署名と独立したOFUSE応援モーダルを追加した公開版。

### 合格した自動試験

```text
OK: regulation audit checks passed (master mapping, precision, quantity formulas, travel, rounding, overhead)
OK: MLIT official role price presets R4-R8
OK: UI static wiring checks passed
```

### 公開HTTPS版の実ブラウザー確認

- 制作署名を押すと「Ez積算」の応援モーダルが開く。
- 無料公開の説明、OFUSEリンク、ログイン送信／ゲスト送信案内、閉じるボタンが表示される。
- 応援モーダルから免責・プライバシーダイアログへ切り替えられる。
- 幅390pxでモーダル幅341px、左右17px、内容の縦スクロールなしで表示できる。
- OFUSEリンクの実送信は外部サービスへの送信となるため自動操作していない。

### 主要ファイルのSHA-256

| ファイル | SHA-256 |
|---|---|
| `index.html` | `C8C21DE49DE6AD538CA67485FC62A408CBF166AED617845F1C96E4E31C17E797` |
| `app.js` | `FCB3AE66EE5242759FC64CB957D04379098184B920012AC234F4E27595613291` |
| `styles.css` | `4BD3EC1291DCBAB1D148FC5B74A7A6AF90D82F29D0C7DD0E5F1537FADFF92024` |
| `tests/test-ui-static.js` | `6970DEC4F85DB354FCC0416E7409A54AEF691E8EF355396192CE8789058403D0` |

## B-2026-08-22-06

- 状態: **検証済み**
- 検証日: 2026-08-22
- コミット: `5b269c5`
- ブランチ: `main`
- 内容: 比較用マスターUIを廃止し、積算地域・積算年度を分離。47都道府県一覧、未収録県の選択禁止、検証済みマスターの同一オリジン・SHA-256付き配信基盤を追加した版。
- 収録済み完全マスター: 徳島県・令和8年度のみ。徳島県以外46県と過去年度は未収録。

### 合格した自動試験

```text
OK: regulation audit checks passed (master mapping, precision, quantity formulas, travel, rounding, overhead)
OK: MLIT official role price presets R4-R8
OK: UI static wiring checks passed
OK: nationwide jurisdiction and verified master catalog checks passed
```

### 実ブラウザー確認

- ローカルHTTP版で積算地域に47都道府県が表示される。
- 徳島県だけが選択可能で、他46県は「マスター未収録」として無効化される。
- 積算年度は「令和8年度（検証済み）」だけを表示する。
- 年度マスター画面に「更新確認済み（2026-08-22）」が表示され、コンソール警告・エラーは0件だった。
- GitHub Pagesビルド `1167031506` はコミット `39388639056b545531074266cc9b57da22af918b` で成功した。
- 公開HTTPS版でも地域47件、未収録・無効46件、徳島県選択、令和8年度検証済み、カタログ最新、警告・エラー0件を確認した。

### 主要ファイルのSHA-256

| ファイル | SHA-256 |
|---|---|
| `index.html` | `0EC6C8E04378CED3E76D3F42703A69A18EF026356B216B8B736825C9178B40B6` |
| `app.js` | `BE5430D8A7593B0D37EE3BF024666FE8C1FF7E3DC445A80F1106536C612F8796` |
| `styles.css` | `27E7D26CFFD81977AEA3DA90994D7F5C364CFC397CC63E68CA52AF752EE79928` |
| `data/master-r8.json` | `03594DE169532381EAF009DD8B6679459DF176FE95250822D05BDEBBF6F66995` |
| `data/master-catalog.json` | `6D8AC4B80FA36D44FE8FE710ADEF5822C9F67B4298F5BFB0024CA3C439EF40B3` |
| `data/prefectures.js` | `D71D9AA5F44DB4DF8A8CA8112A91DCD3AEF5382017579235A94EBA3FCFDA41AC` |
| `tests/test-ui-static.js` | `7405F2BD2BFB896CAD2CB8AFAB564B40487F9A028E236DE14A895A8D70591C07` |
| `tests/test-master-catalog.js` | `F5EA2388BF6ABD7E92B0FB199E18E8A74CD80E5C2A0442C0E3EC973AA945AFBC` |

## B-2026-08-22-07

- 状態: **検証済み**
- 検証日: 2026-08-22
- コミット: `db7662ac5a3c7f8e773de4c948471de6b03b4933`
- ブランチ: `main`
- 内容: 国土交通省（直轄）を47都道府県とは別の発注機関として追加し、令和8年度公開基準参照版、公式出典リンク、地方整備局等の要確認警告、完全マスター収録状況を表示する版。
- 完全検証済み都道府県: 徳島県1/47。国土交通省版は「公開基準参照・要確認」であり、完全検証済みとは表示しない。

### 合格した自動試験

```text
OK: regulation audit checks passed (master mapping, precision, quantity formulas, travel, rounding, overhead)
OK: MLIT official role price presets R4-R8
OK: UI static wiring checks passed
OK: nationwide jurisdiction and verified master catalog checks passed
```

追加構文検査: `node --check app.js`

### ローカルHTTP実ブラウザー確認

- 発注機関48件（国土交通省＋47都道府県）、無効46件、初期選択は徳島県を確認した。
- 国土交通省を選ぶと「令和8年度（公開基準参照・要確認）」、地方整備局等の確認警告、国交省公式出典リンク2件を表示する。
- 収録状況は「完全検証済み1/47都道府県、国土交通省公開基準参照版収録」と表示する。
- JavaScriptページエラー、コンソールエラーはいずれも0件だった。

### 公開HTTPS版の実ブラウザー確認

- GitHub Pagesビルド `1167057698` はコミット `ec18d38d47275ceb7d92714578e34bbd2bfcd41f` で成功した。
- 公開版でも発注機関48件、無効46件、国土交通省参照版、要確認警告、公式出典リンク2件を確認した。
- JavaScriptページエラー、コンソールエラーはいずれも0件だった。

### 主要ファイルのSHA-256

| ファイル | SHA-256 |
|---|---|
| `index.html` | `26499CA035274A1067F1E870F27B1223C86F21EA22F5B0067FD954831753857C` |
| `app.js` | `8AF7064AC3723C7B508378C2FF4F16ABE5869BFFC6172ADA892D445E351FD33B` |
| `data/prefectures.js` | `27C4380447B2206B7090AFD50A5D5D5ECECD0775D63F62345BC92A8E2BE7DB3B` |
| `tests/test-ui-static.js` | `DB9E374CE092114FB9F5DB949D6DFC5D5FBD7F122EB1B823B82E03DEDCD97588` |
| `tests/test-master-catalog.js` | `4CA98EAEB7D480B4ACA40FD126036B83AF4A4902F7253161A9B53E58E0EE240E` |

### 保証しない範囲

- 地方整備局等ごとの適用通知、特記仕様、個別費用、匿名化済み正解積算との一致。
- 徳島県以外46都道府県の完全マスター。未収録県には国交省版・徳島県版を流用しない。

## B-2026-08-22-08

- 状態: **検証済み・未コミット作業ツリー**
- 検証日: 2026-08-22
- 基点コミット: `3cfed5f`
- 内容: 広島県の令和6・7・8年度完全年度マスター、公式原資料台帳、PDF抽出直接経費率108行監査、ローカル初期収録、配信カタログを追加した版。
- 注意: 既存の未コミット変更を保護しているため、この基準はコミットIDではなく下記ハッシュで識別する。公開・pushは未実施。

### 合格した自動試験

```text
OK: regulation audit checks passed (master mapping, precision, quantity formulas, travel, rounding, overhead)
OK: MLIT official role price presets R4-R8
OK: Hiroshima R6-R8 complete annual master audit checks passed
OK: nationwide jurisdiction and verified master catalog checks passed
OK: UI static wiring checks passed
```

追加検査: `node --check app.js`、`node --check data/verified-masters.js`、`node --check tools/generate-hiroshima-masters.js`、`git diff --check`。

### 実ブラウザー確認

- 広島県を選択すると令和8・7・6年度の順に3年度を表示する。
- 2級基準点測量10点の標準直接費は、令和8年度3,448,507円、令和7年度3,387,528円、令和6年度3,073,858円へ切り替わる。
- 完全検証済み表示は2/47都道府県。ブラウザー警告・エラーは0件。

### 主要ファイルのSHA-256

| ファイル | SHA-256 |
|---|---|
| `app.js` | `9BD33563699EBDB6BF0214B1C4FE43F2FBD29F956232ACF0F2A766B8A90A35FF` |
| `index.html` | `CCEB3CF9BB8E2FB217ADD0592668E4C90C798AAFF56FFA3D8E258AB7EE2D5055` |
| `data/master-catalog.json` | `9CA6639DB30B1813B322BBE3C9F4C1639E2B831694B92C1AC35DB967E81D37CF` |
| `data/official-source-catalog.json` | `0C64F9AD03F2298860B4BFA7A4B1CC85A97D896FD8E19F174D5B2FF8EF632346` |
| `data/master-hiroshima-r6.json` | `18181AD84364AB7E97C9EDFA505069C04A628FABDEC3E8EB7146083A725F958F` |
| `data/master-hiroshima-r7.json` | `4AB5E2646C7A7A597B66F487405FDBE9B72CE09CDFFB359DE441E69517889E6E` |
| `data/master-hiroshima-r8.json` | `0992EF182B0E93CC7D0D8C771617459E1761C15EAE60A1E398756D43474B2E5A` |
| `data/source-audits/hiroshima-r6-r8-expense-rates.json` | `4EC6D5233646790C1B0A1FE26BBC3C3313584759D20744C8C98567C966C2E899` |
| `data/verified-masters.js` | `3330736383445F419B13E6E0C18BDB31795FD97C1667CA070E1E4A75F9936F8F` |
| `tests/test-hiroshima-masters.js` | `FF1C90B6F48AB38B50D591D39459ED19DC31E7AA14579D3E967E880CB27F89BC` |
| `tests/test-master-catalog.js` | `3CB89661FE46C68DAAE57EF8A694DE8569FAAB3D6045FDE15189CA0C1D8F2AF2` |
| `tests/test-ui-static.js` | `87BD32B5122E8A588763FBB11EED0A77E88E66E126D242EAD087966BAD581323` |
| `tools/generate-hiroshima-masters.js` | `EDEB4F4046937F8FE5D2C47FBE2DE925C9DEB5BB1939A1FB5C6A22D2F4E026E9` |

### 保証しない範囲

- 航空運航費、成果検定費、案件固有条件、特記仕様、将来の正誤表。
- 匿名化済み正解積算との全134項目・全条件一致。
- 徳島県・広島県以外45都道府県の完全年度マスター。
- 国土交通省直轄の地方整備局等別運用。国版は引き続き公開基準参照・要確認である。

## B-2026-08-22-09

- 状態: **検証済み・未コミット作業ツリー**
- 検証日: 2026-08-22
- 基点コミット: `3cfed5f`
- 内容: SurveyPlan型の「全国標準土台＋県版検証済み上書き」へ変更。国交省と47都道府県の全発注機関で令和6・7・8年度を選択でき、県差分未確認時は全国標準参考として警告する。徳島県令和8年度、広島県令和6～8年度は県版検証済みを優先する。
- 注意: 既存の未コミット変更を保護しているため、この基準はコミットIDではなく下記ハッシュで識別する。公開・pushは未実施。

### 合格した自動試験

```text
OK: regulation audit checks passed (master mapping, precision, quantity formulas, travel, rounding, overhead)
OK: MLIT official role price presets R4-R8
OK: UI static wiring checks passed
OK: nationwide jurisdiction and verified master catalog checks passed
OK: Hiroshima R6-R8 complete annual master audit checks passed
OK: nationwide R6-R8 standard reference master checks passed
```

追加検査: `node --check app.js`、`node --check data/national-standard-masters.js`、`node --check data/verified-masters.js`、`node --check tools/generate-hiroshima-masters.js`、`git diff --check`。

### ローカルHTTP実ブラウザー確認

- 発注機関48件、無効0件。国交省と47都道府県すべてを選択できる。
- 徳島県は令和8年度が県版検証済み、令和6・7年度が全国標準参考。広島県は令和6～8年度が県版検証済み。北海道等の県差分未確認県と国交省は令和6～8年度が全国標準参考。
- 北海道では県独自歩掛、労務・材料・市場・機械単価、補正、適用通知が未反映である警告を表示する。
- 国交省全国標準参考の2級基準点測量10点は、令和6年度3,073,858円／1点307,300円、令和7年度3,387,528円／1点338,700円、令和8年度3,448,507円／1点344,800円を表示する。
- ブラウザーの警告・エラーは0件。

### 主要ファイルのSHA-256

| ファイル | SHA-256 |
|---|---|
| `app.js` | `16E3A2BA4D7370843BEEF6E761EAF6806AD15787F26A6FCB482C9F0D43DB69F8` |
| `index.html` | `E9930812803066DFEC623D85BD9ADD6700DFEBBCCE85A8DADC0A10CC8670AEBC` |
| `data/national-standard-masters.js` | `A1E865B6A2717F582342CDEA754AD46981B3D79C51162BC01787AFAE51E1A740` |
| `data/master-standard-r6.json` | `D740435B129CAE0F988A1DDDFCAEEAD89BD1F44E1DFDD20E3BF4C2996EE93F7C` |
| `data/master-standard-r7.json` | `0EAD9280B64B58509489F6E1CE764A25847C86CA093451DBFF65A59A2AA72F5B` |
| `data/master-standard-r8.json` | `496398A9695DDF482AAA5CE93B542EFCBF40417B95F6CF8D249A37FD99713BAD` |
| `data/verified-masters.js` | `3330736383445F419B13E6E0C18BDB31795FD97C1667CA070E1E4A75F9936F8F` |
| `data/official-source-catalog.json` | `0C64F9AD03F2298860B4BFA7A4B1CC85A97D896FD8E19F174D5B2FF8EF632346` |
| `data/source-audits/hiroshima-r6-r8-expense-rates.json` | `4EC6D5233646790C1B0A1FE26BBC3C3313584759D20744C8C98567C966C2E899` |
| `tests/test-nationwide-standard.js` | `0FB7104286D86345472830BD3CA287433898071CD2E75E8716AA3BA7386828AD` |
| `tests/test-hiroshima-masters.js` | `FF1C90B6F48AB38B50D591D39459ED19DC31E7AA14579D3E967E880CB27F89BC` |
| `tests/test-master-catalog.js` | `B3144A02CF4A7613DB127BEB783877CA442E1A716E6F175E2C3E34D94C91BD43` |
| `tests/test-ui-static.js` | `8D69B0E8461ABC82B3A25D77558C9B608B0CD0AB8C4820594276CFE6B31189A6` |
| `tools/generate-hiroshima-masters.js` | `0F312D99B8CBCDFFD87B51F90499CDF510883F209D6487085EB6F9CC6FA993B5` |

### 保証しない範囲

- 徳島県・広島県以外45都道府県の県独自歩掛、単価、補正、適用通知。
- 地方整備局等ごとの適用通知、特記仕様、個別費用。
- 航空運航費、成果検定費、案件固有条件、将来の正誤表。
- 匿名化済み正解積算との全134項目・全条件一致。

## B-2026-08-22-10

- 状態: **検証済み・未コミット作業ツリー**
- 検証日: 2026-08-22
- 基点コミット: `3cfed5f`
- 内容: フッターの重複導線を「Ez積算」1ボタンに統合。制作会社・公式サイト・OFUSE応援・ゲスト送信案内・免責・プライバシー設定を1つのダイアログへ集約した。
- 注意: B-2026-08-22-09以降の未コミット変更を含む。公開・pushは未実施。

### 合格した試験

```text
OK: UI static wiring checks passed
OK: regulation audit checks passed (master mapping, precision, quantity formulas, travel, rounding, overhead)
OK: MLIT official role price presets R4-R8
OK: nationwide jurisdiction and verified master catalog checks passed
OK: Hiroshima R6-R8 complete annual master audit checks passed
OK: nationwide R6-R8 standard reference master checks passed
```

追加検査: `node --check app.js`、`git diff --check`。

### ローカルHTTP実ブラウザー確認

- フッターの表示・ボタンは「Ez積算」1個、フッター内リンク0件、ページ内ダイアログ1個。
- Analytics同意を拒否した後、フッターの「Ez積算」を押すと統合ダイアログがモーダル表示される。
- 統合ダイアログに「制作」「応援のご案内」「利用条件・免責事項」「プライバシー・アクセス解析」、公式サイト、OFUSE、アクセス解析設定を表示する。
- ブラウザーの警告・エラーは0件。

### 主要ファイルのSHA-256

| ファイル | SHA-256 |
|---|---|
| `index.html` | `49C9B5AA9EE38CD35101B72E5BD825A0D0EB655DE689DEE0C0C703D2D89DD261` |
| `app.js` | `B462A8DF2E7F70D38F38D2F202974B4A41A4AB5B1CE0DB01F2FD83BD65289ED4` |
| `styles.css` | `1CD4AF87E59B244EC56C51FD40B36859DF6B066B7781EAB07AC8F84FFF78ACDE` |
| `tests/test-ui-static.js` | `D96F6BD46855152017D00BE53B9927B2843AA961CABC3A86E053D5340E5A69A5` |

### 未検証

- GitHub Pages公開後の表示とキャッシュ更新。
- GA管理画面への許可時着信。

## B-2026-08-22-11

- 状態: **検証済み・GitHub Pages公開版**
- 検証日: 2026-08-22
- アプリコミット: `7ab9313941940e2d7ce41204344816ba549a253f`
- ブランチ: `main`
- 公開URL: `https://iku190t.github.io/tokushima-survey-sekisan/`
- Pagesビルド: `1167136725`、状態`built`、エラーなし
- 内容: B-2026-08-22-09とB-2026-08-22-10を統合して公開。国交省＋47都道府県、全国標準参考R6～R8、徳島県R8・広島県R6～R8の県版検証済み上書き、フッター1ボタンの統合案内を含む。

### 合格した試験

```text
OK: regulation audit checks passed (master mapping, precision, quantity formulas, travel, rounding, overhead)
OK: MLIT official role price presets R4-R8
OK: UI static wiring checks passed
OK: nationwide jurisdiction and verified master catalog checks passed
OK: Hiroshima R6-R8 complete annual master audit checks passed
OK: nationwide R6-R8 standard reference master checks passed
```

追加検査: `node --check app.js`、`node --check data/national-standard-masters.js`、`node --check data/verified-masters.js`、`node --check tools/generate-hiroshima-masters.js`、`git diff --check`、秘密鍵・GitHubトークン形式の静的走査。

### 公開HTTPS版の実ブラウザー確認

- 発注機関48件、無効0件。初期選択の徳島県で令和8年度県版検証済み、令和7・6年度全国標準参考を表示する。
- フッターは「Ez積算」ボタン1個、直リンク0件、ページ内ダイアログ1個。
- 「Ez積算」を押すと、制作、公式サイト、OFUSE応援、免責、プライバシー・アクセス解析設定を1画面に表示する。
- ブラウザー警告・エラー0件。

### 主要ファイルのSHA-256

| ファイル | SHA-256 |
|---|---|
| `index.html` | `49C9B5AA9EE38CD35101B72E5BD825A0D0EB655DE689DEE0C0C703D2D89DD261` |
| `app.js` | `B462A8DF2E7F70D38F38D2F202974B4A41A4AB5B1CE0DB01F2FD83BD65289ED4` |
| `styles.css` | `1CD4AF87E59B244EC56C51FD40B36859DF6B066B7781EAB07AC8F84FFF78ACDE` |
| `DISCLAIMER.md` | `EF7336700C53FF8C10F9F2A28B69B7EB040C86D5E29B26F4BE1C32FF7DA98148` |
| `data/master-catalog.json` | `9CA6639DB30B1813B322BBE3C9F4C1639E2B831694B92C1AC35DB967E81D37CF` |
| `data/national-standard-masters.js` | `A1E865B6A2717F582342CDEA754AD46981B3D79C51162BC01787AFAE51E1A740` |
| `tests/test-ui-static.js` | `D96F6BD46855152017D00BE53B9927B2843AA961CABC3A86E053D5340E5A69A5` |
| `tests/test-nationwide-standard.js` | `0FB7104286D86345472830BD3CA287433898071CD2E75E8716AA3BA7386828AD` |

### 保証しない範囲

- 徳島県・広島県以外45都道府県の県独自歩掛、単価、補正、適用通知。
- 地方整備局等ごとの適用通知、特記仕様、個別費用。
- 匿名化済み正解積算との全項目・全条件一致。
- GA管理画面への許可時着信。

## B-2026-08-22-12

- 状態: **検証済み・未コミット作業ツリー**
- 検証日: 2026-08-22
- 基点コミット: `7c6f599b48f1d409fc66f816484e406396e478e6`
- 内容: 既存の測量積算を保持し、土木設計、調査・計画、地質解析等、地質一般調査の人工入力・年度単価・区分別経費計算・測量との総合計・総合帳票を追加したローカル版。
- 公開・push: 未実施。

### 合格した試験

```text
OK: consulting/design/geology calculation checks passed
OK: consulting UI and report wiring checks passed
OK: MLIT official role price presets R4-R8 and consulting roles R6-R8
OK: regulation audit checks passed (master mapping, precision, quantity formulas, travel, rounding, overhead)
OK: UI static wiring checks passed
OK: nationwide jurisdiction and verified master catalog checks passed
OK: Hiroshima R6-R8 complete annual master audit checks passed
OK: nationwide R6-R8 standard reference master checks passed
```

追加検査: `node --check app.js`、`node --check consulting.js`、`node --check consulting-engine.js`、`node --check data/consulting-master.js`、`node --check data/official-role-prices.js`、`git diff --check`。

### 実ブラウザー確認

- 画面切替は「測量積算」「設計・調査積算」「帳票・PDF」「年度・単価マスター」「使い方・計算根拠」の5タブ。
- 令和8年度の確認済みプリセット「設計留意書の作成」は、主任技師0.5人日＋技師（A）1.0人日、直接人件費98,050円、その他原価52,796円、一般管理費等81,224円、設計業務価格232,070円、税込255,277円。
- 令和7年度へ切り替えると直接人件費93,050円、設計業務価格220,235円、税込242,258円。
- 令和8年度地質一般調査で地質調査技師1人日、直接調査費（人件費以外）100,000円、間接調査費200,000円、対象外費用10,000円とした固定値は、対象額358,300円、諸経費率82.5%、諸経費295,597円、地質業務価格663,897円。
- 上記設計と地質を合算した総合業務価格895,967円、消費税89,596円、税込985,563円。
- ブラウザー警告・エラー0件。
- 幅390pxで本文幅375px、設計・調査の表表示枠345px・内部表850px。表は専用枠内で横スクロールする。既知のページ根元`scrollWidth=485px`は継続観察とする。

### 主要ファイルのSHA-256

| ファイル | SHA-256 |
|---|---|
| `index.html` | `A2FD1011BF3FE03596C383E79E5FDDC9E287F2A8525215CC1FE1780EAA4A3CDC` |
| `app.js` | `B5F1F5E3E849F3273A45096092BFACB030FF699595456DF57FC5E8F145F1F0D9` |
| `consulting.js` | `564DE66DB00DE7083B2A3E0BFE064DD672A805CC739BD969214643AF07E8F976` |
| `consulting-engine.js` | `A283B6C5D6081045FE0029B76FBDA54C924CCCBAEE624EF55EDD17FDFDC81212` |
| `styles.css` | `D40005DE47F613F1A61523565533161E1AFCA8B50B97C1CB46A269CCBBE0D160` |
| `data/consulting-master.js` | `2C9AC54CA56457309290716F7307EFED93A38D228D0706E190D542BE096284D8` |
| `data/official-role-prices.js` | `08048B827EB6EC705903F09EB863D7F7C83BC813C51E28264FB4FE1232240100` |
| `tests/test-consulting-engine.js` | `DD0179824BF7EA70DFD181227DC37F4F1EB6C1FE0CD4F639DD6C4F05DABB1399` |
| `tests/test-consulting-ui.js` | `0D7749CD86AEBC04A975DA3EA9A74284C3D60A852909623B84ED6799EFC16D2C` |

### 保証しない範囲

- 設計・調査・地質の全標準歩掛、市場単価、機械・材料・運搬・仮設・旅費、都道府県差分。
- 人工入力行の採用歩掛が案件に適合すること。
- 総合帳票を実際にPDF保存した全ページの目視品質。
- 匿名化済み正解積算との費目別一致。

## B-2026-08-22-13

- 状態: **検証済み・未コミット作業ツリー**
- 検証日: 2026-08-22
- 基点コミット: `7c6f599b48f1d409fc66f816484e406396e478e6`
- 内容: B-2026-08-22-12へ、PDF直接抽出、画像・画像PDFの日本語OCR、測量・設計・調査・地質の候補化、確認・修正ダイアログ、選択後反映を追加したローカル版。
- 公開・push: 未実施。

### 合格した試験

```text
OK: document PDF/OCR extraction and review candidate checks passed
OK: document import review UI and safe apply wiring checks passed
OK: consulting/design/geology calculation checks passed
OK: consulting UI and report wiring checks passed
OK: MLIT official role price presets R4-R8 and consulting roles R6-R8
OK: regulation audit checks passed (master mapping, precision, quantity formulas, travel, rounding, overhead)
OK: UI static wiring checks passed
OK: nationwide jurisdiction and verified master catalog checks passed
OK: Hiroshima R6-R8 complete annual master audit checks passed
OK: nationwide R6-R8 standard reference master checks passed
```

追加検査: `node --check`を`app.js`、`consulting.js`、`consulting-engine.js`、`document-import-engine.js`、`document-reader.js`、`document-import.js`、`data/consulting-master.js`、`data/official-role-prices.js`へ実行し合格。`git diff --check`合格。

### 匿名合成資料による実ブラウザー確認

- A4・1ページの文字入り合成PDFを作成し、PDF.js 4.10.38の直接文字抽出で「PDF文字抽出」と判定した。
- 測量3候補（2級基準点20点、4級水準3.5km、現地測量作業計画1業務）、設計・地質人工3候補（技師A 2.5人日、主任技師0.75人日、地質調査技師1.25人日）、低確信度・未選択の間接調査費1候補を表示した。
- 確認画面で2級基準点を21点、技師Aを2.75人日に修正し、測量3件・人工3件を反映した。測量側は21点・3.5km・1業務、設計側は2.75・0.75・1.25人日を保持し、測量合算を有効にした。
- 同じ合成資料をPNG画像としてTesseract.js 5.1.1の日本語・英語OCRへ入力した。OCRが数字を丸数字、4級を4紐、金額区切りを点として認識する状態を再現した。
- 丸数字、日本語文字間隔、3桁点区切りの正規化後、候補7件を表示した。基準点、現地測量、設計、地質解析、地質一般の5件は選択、水準測量と金額は低確信度・未選択とした。
- 確認ダイアログのデスクトップ表示を目視し、設計・調査行の確信度表示が狭い列へ回り込む不具合を修正後、再表示で解消を確認した。
- 検証用PDF、PNG、生成スクリプトは検証後に削除した。

### 主要ファイルのSHA-256

| ファイル | SHA-256 |
|---|---|
| `index.html` | `B801565FF325351B670210A09AF24A34C26F678973E2B500DCE0D20C455EA1BA` |
| `styles.css` | `5C3DD968E36285827116F25974D2AB68801786D6A0E00D7ED45143DA1DE13980` |
| `app.js` | `B7B6332637C9F75639C074193293489724D49E4591CA5E8C17D9C95E4644F366` |
| `consulting.js` | `66D86E0D840C1DCC3928C8783935EFE2C44F82FD4547E54BEC913FEF639D442D` |
| `document-import-engine.js` | `58084E4692D3F6D970E4DA3DDAB98FC7C72BCAA713F4EF83D15338A674CB47C9` |
| `document-reader.js` | `29BEC05F987DC705235CB671DC68C62CFBF31A9D35FD926F3A7A91DFABD2CD8E` |
| `document-import.js` | `2E1706E0C6E206A02614A6E127EB6CC56D92E336F7FBFAFAED29EF5703313A49` |
| `tests/test-document-import.js` | `5620EC4DF48E989CCA9837BD4CE2917531E9941052439E6D18394AC86DF7D82E` |
| `tests/test-document-import-ui.js` | `8C3F179C43FFF6BCE7F8B1FF046D25DE2303C02DAE10182D91D68CFA8C24069F` |
| `README.txt` | `16893B117FEB5027FF5E37B6AEB5BE9B1418348CF37AF6F0759FD76C147CEDB8` |
| `DISCLAIMER.md` | `84B9B3B1BF98B0C13DADF35F672A47263F9489323B3C3459327B84893709BC96` |

### 保証しない範囲

- 匿名合成資料以外の発注機関様式、複雑な表、縦書き、低解像度、傾き、手書き、押印重なりに対する抽出率。
- OCR・PDF抽出候補が元資料と一致すること。候補は利用者の原文照合前に正解値として扱わない。
- PDF.js、Tesseract.js、OCR言語データの外部配信先へ接続できない環境でのPDF・OCR自動読取り。原文貼付け経路は残す。
- 実案件の抽出結果と正解積算の一致。

## B-2026-08-22-14

- 状態: **検証済み・未コミット作業ツリー**
- 検証日: 2026-08-22
- 基点コミット: `7c6f599b48f1d409fc66f816484e406396e478e6`
- 内容: B-2026-08-22-13へ、業務名、発注者、担当部署、担当者、業務場所、履行期間、文書・業務番号、公告・資料日の項目別抽出・確認・修正・選択反映、業務基本情報欄、帳票連携を追加したローカル版。発注機関・年度マスターは初期未選択とする。
- 公開・push: 未実施。

### 合格した試験

```text
OK: document PDF/OCR extraction and review candidate checks passed
OK: document import review UI and safe apply wiring checks passed
OK: consulting/design/geology calculation checks passed
OK: consulting UI and report wiring checks passed
OK: MLIT official role price presets R4-R8 and consulting roles R6-R8
OK: regulation audit checks passed (master mapping, precision, quantity formulas, travel, rounding, overhead)
OK: UI static wiring checks passed
OK: nationwide jurisdiction and verified master catalog checks passed
OK: Hiroshima R6-R8 complete annual master audit checks passed
OK: nationwide R6-R8 standard reference master checks passed
```

追加検査: `node --check`を`app.js`、`consulting.js`、`consulting-engine.js`、`document-import-engine.js`、`document-reader.js`、`document-import.js`、`data/consulting-master.js`、`data/official-role-prices.js`へ実行し合格。`git diff --check`合格。

### 匿名合成原文による実ブラウザー確認

- 業務基本情報10候補（通常8項目、初期未選択の発注機関・年度2項目）と積算2候補（測量数量、設計人工）を同一ダイアログへ表示した。
- 各基本情報候補に、編集欄、反映チェック、元の行、ページ、抽出方法、確信度が表示された。確認画面のデスクトップ表示を目視し、列崩れ・文字重なりがないことを確認した。
- 担当者を確認画面で修正し、通常基本情報8件、測量1件、設計人工1件を反映した。業務基本情報欄に修正値を保持し、発注者は帳票宛名、履行期間は帳票納期へ同期した。
- 測量2級基準点20点と設計技師A 2.5人日は従来どおり各積算へ反映された。
- 発注機関・年度の初期未選択、変更時確認のコード結線は静的試験済み。実ブラウザーによるマスター切替完了までは未検証扱いとする。

### 主要ファイルのSHA-256

| ファイル | SHA-256 |
|---|---|
| `index.html` | `6C69EFDC341ECBFCD5DFDD1285E943DB7B6E222BFB952C2F197E747DC76C965A` |
| `styles.css` | `9F54631C22660972952B1721BCFAC4B214773DF3E15679B42007361AFFD6DFE6` |
| `app.js` | `05597E3AE5C5175AF8A17AB936B252005D39762A294FA74A9552B421CDEC9E68` |
| `consulting.js` | `FFEC2CA9BF03BCFF1F1E1F3D7CD530939EBB8BB5EFF39C7BB2D20967496F7786` |
| `document-import-engine.js` | `CD732CCA110FC3492E7CD13350F08E29DEA77545A78696C12089342D20ED1174` |
| `document-reader.js` | `29BEC05F987DC705235CB671DC68C62CFBF31A9D35FD926F3A7A91DFABD2CD8E` |
| `document-import.js` | `97B9D075123E4C5DBD517D5B9762D5E3D7A8F8D8D469859D154AF6422B712508` |
| `tests/test-document-import.js` | `06E91915CF6F1A26CAF5E45FDB5B39F209C90CF2D5F42F4F927823019019DFD2` |
| `tests/test-document-import-ui.js` | `9A5ED6C0C13EFFB6E088DDFB30506365D84EE6C1A05DD0535B96C18AFC982445` |
| `README.txt` | `BA8D06E98E6C024B144943B0B6493FDF518E4BC5E0D817DAE2F0B308F00FAED6` |
| `DISCLAIMER.md` | `84B9B3B1BF98B0C13DADF35F672A47263F9489323B3C3459327B84893709BC96` |

### 保証しない範囲

- 匿名合成原文以外の発注機関様式、表セル分割、複数候補、変更契約、住所改行、縦書き、低品質OCRでの業務基本情報抽出率。
- 抽出された発注者、担当者、場所、期間、番号、日付が元資料と一致すること。利用者の原文照合を必須とする。
- 発注機関・年度マスターを確認ダイアログから切り替える実ブラウザー完了操作。

## B-2026-08-22-15

- 状態: **検証済み・未コミット作業ツリー**
- 検証日: 2026-08-22
- 基点コミット: `7c6f599b48f1d409fc66f816484e406396e478e6`
- 内容: B-2026-08-22-14へ、官公需情報ポータルAPI用検索条件、公式XML読込、案件一致度、公告・仕様書・数量表・質問回答・訂正版等の資料分類、採用状態・取得元・ハッシュを保持する案件資料台帳を追加したローカル版。
- 公開・push: 未実施。

### 合格した試験

```text
OK: regulation audit checks passed (master mapping, precision, quantity formulas, travel, rounding, overhead)
OK: MLIT official role price presets R4-R8 and consulting roles R6-R8
OK: UI static wiring checks passed
OK: nationwide jurisdiction and verified master catalog checks passed
OK: Hiroshima R6-R8 complete annual master audit checks passed
OK: nationwide R6-R8 standard reference master checks passed
OK: consulting/design/geology calculation checks passed
OK: consulting UI and report wiring checks passed
OK: document PDF/OCR extraction and review candidate checks passed
OK: document import review UI and safe apply wiring checks passed
OK: official procurement case matching, XML parsing, and source ledger candidates passed
OK: official case search UI, source ledger, revision warning, and safe static-site wiring passed
```

追加検査: `node --check`を主要JavaScript 10ファイルへ実行し合格。`git diff --check`合格。危険なURLスキームを台帳候補から除外する固定値試験も合格。

### 公式仕様・実ブラウザー確認

- 官公需情報ポータル検索APIガイドV1.1で、案件名、機関名、地方公共団体コード、公告日等の検索条件と、案件キー、原ページURL、案件名、機関名、履行場所、添付資料URL等のXML結果項目を確認した。
- 公式HTTPS APIが2026-08-22時点でXMLを返すこと、試験条件の応答に検索結果1件と添付資料2件が含まれることを確認した。応答にCORS許可ヘッダーは確認できなかった。
- 匿名合成XMLをローカル実画面へ読み込み、番号・業務名・発注機関・都道府県・年度の一致理由と一致度100を表示した。
- 公告、仕様書、数量表、訂正版の4資料を台帳登録し、採用済み資料なし・訂正版未採用の警告を表示した。公告と訂正版を採用後、警告が消えることを確認した。
- 候補表示と資料台帳のデスクトップ表示を目視し、列崩れ・文字重なりがないこと、ブラウザー警告・エラー0件を確認した。検証用XMLは削除した。

### 主要ファイルのSHA-256

| ファイル | SHA-256 |
|---|---|
| `index.html` | `DB969C90A470C1EBBBBC3C955A01D915A473B694A18073729B8A27A74B3E574D` |
| `styles.css` | `13B661FDF52C4D0E17C41931EC6FF0959A09102955830D29DA3D722D363A1AD6` |
| `app.js` | `31D6785F8507C82DB5748FA3FDFF51235BED79FC37FA3473785D6FFAD1DF7D5C` |
| `official-case-engine.js` | `8B010B1A4AE9EF904021C617011B95039B2E6E1FD7615844486296D4C392FFB0` |
| `official-case-search.js` | `C9CFF129D94D72EE5E17A3B6F13C3A05F5FE4CC1A1DD1E33D428558E55306075` |
| `tests/test-official-case-engine.js` | `6C90BCA389A6FA63647437F6370CD3979DBE4F6B5673386BB12E8E73ADCDF980` |
| `tests/test-official-case-ui.js` | `C3D02E2FF8913CFD5C412764C8974AFAE09E5C3A303B42B3AF06B32DCA75D54D` |
| `README.txt` | `E8D1C27605FBAF4B68F5F063E71001E253C1E184B88F3297E036CD15EB973C58` |
| `DISCLAIMER.md` | `1796EC618248F5D3B40E36303352BB39BC7DEECF6AE277E75AA38A88EB812B98` |

### 保証しない範囲

- 官公需情報ポータルに全公告・全添付・最新版が収録されること、公開リンクが継続すること。
- 実案件での候補再現率・誤一致率、同名案件・番号表記ゆれ・変更契約・後日訂正の自動解決。
- 一致度、資料種別、採用状態が原資料の内容確認を代替すること。利用者が発注機関の原ページと最新版を確認する。

## B-2026-08-22-16

- 状態: **検証済み・未コミット作業ツリー**
- 検証日: 2026-08-22
- 基点コミット: `7c6f599b48f1d409fc66f816484e406396e478e6`
- 内容: B-2026-08-22-15へ、アプリ見出し「web積算」、設計業務・測量業務・航空／船舶関係・地質業務の4業務タブ、タブ別の作業・業務区分・積上費用表示を追加したローカル版。既存の保存データ構造と計算エンジンは変更しない。
- 公開・push: 未実施。

### 合格した試験

```text
OK: regulation audit checks passed (master mapping, precision, quantity formulas, travel, rounding, overhead)
OK: MLIT official role price presets R4-R8 and consulting roles R6-R8
OK: UI static wiring checks passed
OK: nationwide jurisdiction and verified master catalog checks passed
OK: Hiroshima R6-R8 complete annual master audit checks passed
OK: nationwide R6-R8 standard reference master checks passed
OK: consulting/design/geology calculation checks passed
OK: consulting UI and report wiring checks passed
OK: document PDF/OCR extraction and review candidate checks passed
OK: document import review UI and safe apply wiring checks passed
OK: official procurement case matching, XML parsing, and source ledger candidates passed
OK: official case search UI, source ledger, revision warning, and safe static-site wiring passed
```

追加検査: `node --check`を`app.js`、`consulting.js`へ実行し合格。`git diff --check`合格。

### 実ブラウザー確認

- ヘッダー見出しが「web積算」、初期表示が「設計業務」であることを確認した。
- 業務タブの順番が「設計業務」「測量業務」「航空・船舶関係」「地質業務」であることを確認した。
- 設計業務タブは土木設計業務・調査計画業務だけ、地質業務タブは地質解析等調査業務・地質一般調査業務だけを表示した。
- 測量業務タブは共通・基準点・水準・路線・河川・用地・現地測量の77項目、航空・船舶関係タブは深浅・空中写真・航空レーザ・UAV写真点群・地上レーザ・UAVレーザの57項目を表示した。合計134項目で重複なし。
- 地質業務に確認済み標準歩掛がない状態では追加ボタンを無効化し、推定歩掛を追加しないことを確認した。
- デスクトップ表示でタブ、入力欄、総合結果の重なり・崩れがなく、ブラウザー警告・エラー0件を確認した。

### 主要ファイルのSHA-256

| ファイル | SHA-256 |
|---|---|
| `index.html` | `6D5AA6AC4FC53E096EF9FB49CC51CFEF3144AC477E9D3994AB1F4390CF62F1FF` |
| `styles.css` | `049B679C8029882EDA08C3C2D71E7673639BFDFB672BE100BAF153D4F8546924` |
| `app.js` | `57009410D18E0346E1DA35E6BAF74ABB2A0408215A70FDDFFD66D4FC060EA0FA` |
| `consulting.js` | `7739467617DE1BB7259ACF9EB7F55B7BF418154959C5C81DC89FDD30D1883DBD` |
| `tests/test-ui-static.js` | `650FDAD07582DB9C91DDDEA92E41D8BE0D2A9D49CAAB4B90DB155A8600E5B8E2` |
| `tests/test-consulting-ui.js` | `5B5B07CB4149FF9A62F27482078696F63BF0DA37F300C8C922EC3C198C0A544E` |
| `tests/test-document-import-ui.js` | `0341F1418519784F537644DCF974EE1F8B3A05DF00E7BEE4D8E950E9B0D362F3` |
| `README.txt` | `A4B3CB06E278CD4B460D0D1DD37B7C0DAA8AC478587A0FEB087143EB99B7695D` |
| `DISCLAIMER.md` | `C19A06DD3BFB4EEF7B185D8C65119820FC518AD65BF15FB6D78D7AA616237C6A` |

### 保証しない範囲

- タブ分離は表示と入力候補の区分であり、各業務を別案件・別保存ファイルへ自動分割しない。
- 航空・船舶関係を独立した別計算方式へ変更したものではなく、収録済み測量積算基準の該当作業を表示する。

## B-2026-08-22-17

- 状態: **検証済み・GitHub Pages公開済み**
- 検証日: 2026-08-22
- アプリコミット: `0f6a2a567f92740a9bb825e714c53ef0d1ac7766`
- GitHub Pagesビルド: `1167424133`（`built`）
- 公開URL: `https://iku190t.github.io/tokushima-survey-sekisan/`
- 内容: B-2026-08-22-16を公開し、大型の黄色い参考試算注意帯を廃止。「使い方・計算根拠」の右側に小型の「参考試算・免責」ボタンを配置し、押した場合だけ既存の統合案内を表示する。

### 合格した試験

```text
OK: regulation audit checks passed (master mapping, precision, quantity formulas, travel, rounding, overhead)
OK: MLIT official role price presets R4-R8 and consulting roles R6-R8
OK: UI static wiring checks passed
OK: nationwide jurisdiction and verified master catalog checks passed
OK: Hiroshima R6-R8 complete annual master audit checks passed
OK: nationwide R6-R8 standard reference master checks passed
OK: consulting/design/geology calculation checks passed
OK: consulting UI and report wiring checks passed
OK: document PDF/OCR extraction and review candidate checks passed
OK: document import review UI and safe apply wiring checks passed
OK: official procurement case matching, XML parsing, and source ledger candidates passed
OK: official case search UI, source ledger, revision warning, and safe static-site wiring passed
```

追加検査: `git diff --check`合格。

### ローカル・公開版の実ブラウザー確認

- 本文先頭の大型注意帯が0件、「使い方・計算根拠」直後の小型「参考試算・免責」ボタンが表示されることを確認した。
- 小型ボタンから統合ダイアログが開き、公式ソフトではない旨、制作、応援、免責、プライバシーが表示されることを確認した。
- 公開HTTPS版で見出し「web積算」、4業務タブ、上部小型免責ボタン、大型注意帯0件を確認した。
- ローカル版・公開版ともブラウザー警告・エラー0件。

### 主要ファイルのSHA-256

| ファイル | SHA-256 |
|---|---|
| `index.html` | `754B0B17D6B3D7300924196E5DF1FC44B4776A78712F599DD19A045204CF9E0D` |
| `styles.css` | `5CB0BD3EAD842AA566A5B8C53327EB6C2FE360571F5AED01414EC9E91E2FF415` |
| `app.js` | `57009410D18E0346E1DA35E6BAF74ABB2A0408215A70FDDFFD66D4FC060EA0FA` |
| `consulting.js` | `7739467617DE1BB7259ACF9EB7F55B7BF418154959C5C81DC89FDD30D1883DBD` |
| `README.txt` | `CE81C896E5ADABECB481B635D82567FC858829D91C164F7C0E3D269AD69A5C56` |
| `DISCLAIMER.md` | `C19A06DD3BFB4EEF7B185D8C65119820FC518AD65BF15FB6D78D7AA616237C6A` |
| `tests/test-ui-static.js` | `8D46C45E4D03979BE7AA49BD5AFF19464EC4C788D67039AC7DB1AD8001745C8A` |

## B-2026-08-22-18

- 状態: **検証済み・GitHub Pages公開済み**
- 検証日: 2026-08-22
- アプリコミット: `c304ad40d95a2d87d15ef22dbf81deac1eff739b`
- GitHub Pagesビルド: `1167449473`（`built`）
- 公開URL: `https://iku190t.github.io/tokushima-survey-sekisan/`
- 内容: B-2026-08-22-17へ、資料取込0件時の明示案内・終了動作、候補がない区分の選択欄非表示、業務数量総括表のラベルなし見出しを要確認の業務名候補とする処理を追加した版。

### 合格した試験

```text
OK: consulting/design/geology calculation checks passed
OK: consulting UI and report wiring checks passed
OK: document import review UI and safe apply wiring checks passed
OK: document PDF/OCR extraction and review candidate checks passed
OK: regulation audit checks passed (master mapping, precision, quantity formulas, travel, rounding, overhead)
OK: Hiroshima R6-R8 complete annual master audit checks passed
OK: nationwide jurisdiction and verified master catalog checks passed
OK: nationwide R6-R8 standard reference master checks passed
OK: official procurement case matching, XML parsing, and source ledger candidates passed
OK: official case search UI, source ledger, revision warning, and safe static-site wiring passed
OK: MLIT official role price presets R4-R8 and consulting roles R6-R8
OK: UI static wiring checks passed
```

追加検査: `git diff --check`合格。

### 実ブラウザー確認

- 匿名合成の業務数量総括表で、業務名見出し1件・積算0件を表示し、業務名だけを反映できることを確認した。
- 基本情報0件・積算0件では両区分の選択操作が非表示となり、「読み取れる項目なし・閉じる」でダイアログが閉じることを確認した。
- GitHub Pages公開版でも0件時の両選択区分が非表示で、終了ボタンが動作し、ブラウザー警告・エラー0件だった。

### 主要ファイルのSHA-256

| ファイル | SHA-256 |
|---|---|
| `index.html` | `C19C7F42B76A2961A3495D505C71C3F48DA5FCED2FBF763A04C9DBC05D7136E7` |
| `styles.css` | `FA85663572D2015916B8E941E10ADFD1530C98DDDC8349EC862E8080C78BD595` |
| `document-import-engine.js` | `5F887CE2F13C16EF8E028FC07CC524D2B0533985C53603FC4B57F077BF694194` |
| `document-import.js` | `FF73A45FD320EF7642652AF1E43EC901672899C2F5A28805D39466AD5457E9DC` |
| `tests/test-document-import.js` | `BF5991B5D26A1280B153B80BC301EAA52D0B90FB4D6B67B7FC718CE142CE37C4` |
| `tests/test-document-import-ui.js` | `FE52FAFE22FD7CBAC6F5AC392B378F9B72B68071DD99E83EF8A46E1C697E347D` |

## B-2026-08-22-19

- 状態: **検証済み・GitHub Pages公開済み**
- 検証日: 2026-08-22
- アプリコミット: `39409c37c3c6815ce0f33f4da2fab8e33d767447`
- GitHub Pagesビルド: `1167480532`（`built`）
- 公開URL: `https://iku190t.github.io/tokushima-survey-sekisan/`
- 内容: B-2026-08-22-18へ、PDFページ画像、文字行座標のクリック枠、反映待ち一覧、確信度の高い候補の安全な一括選択、既存確認画面への接続を追加した版。

### 合格した試験

```text
OK: consulting/design/geology calculation checks passed
OK: consulting UI and report wiring checks passed
OK: document import review UI and safe apply wiring checks passed
OK: document PDF/OCR extraction and review candidate checks passed
OK: regulation audit checks passed (master mapping, precision, quantity formulas, travel, rounding, overhead)
OK: Hiroshima R6-R8 complete annual master audit checks passed
OK: nationwide jurisdiction and verified master catalog checks passed
OK: nationwide R6-R8 standard reference master checks passed
OK: official procurement case matching, XML parsing, and source ledger candidates passed
OK: official case search UI, source ledger, revision warning, and safe static-site wiring passed
OK: MLIT official role price presets R4-R8 and consulting roles R6-R8
OK: UI static wiring checks passed
```

追加検査: `git diff --check`合格。

### 実ブラウザー確認

- 文字入り匿名合成PDF 1ページを直接抽出し、業務名、発注者・発注機関、年度、測量2行、設計人工1行のクリック候補6行をPDFページ画像上へ表示した。
- PDF上で業務名、2級基準点測量20点、技師（A）2.5人日の3行をクリックし、反映待ち3件、確認画面の基本情報1件・積算候補2件が選択済みとなった。
- 確認後、業務名1件、測量1件、設計人工1件、積上費用0件だけが反映され、ブラウザー警告・エラー0件だった。
- GitHub Pages公開版でクリック取込画面と更新済み`document-reader.js?v=20260822-2`、`document-import.js?v=20260822-4`を確認し、ブラウザー警告・エラー0件だった。

### 主要ファイルのSHA-256

| ファイル | SHA-256 |
|---|---|
| `index.html` | `D3BFC5C46BDC4C932EB6F45DB0CB7E06B1B65454F56EEF8E78B554830D16B952` |
| `styles.css` | `447C9514A585308CA259872EB2339FA99DF2DB4E9681B8B38244A34684746CFC` |
| `document-reader.js` | `E453944BF9F3598DA558D904097B171B6EF386848439E77B2E5A6C99AB49B0A7` |
| `document-import.js` | `7A966365A9947323E6DE4146418BCBD2599A68A7D9051700A3DA1E50AA50A898` |
| `tests/test-document-import.js` | `5DF46E8A67EACC8DFA6CAC4E7D5DA6EFA6BA1B80931765CA1C17D5830AAC2165` |
| `tests/test-document-import-ui.js` | `4F17459C7BCF7AF343BFE45F235F8779202C6529E64BD8381578413360175B9B` |

## B-2026-08-22-20

- 状態: **検証済み・GitHub Pages公開済み**
- 検証日: 2026-08-22
- アプリコミット: `a3a14e1495056639a638e0bbf4b3430aa2dc15aa`
- GitHub Pagesビルド: `1167519629`（`built`）
- 公開URL: `https://iku190t.github.io/tokushima-survey-sekisan/`
- 内容: B-2026-08-22-19へ、PDF全抽出行のクリック、未判定行の手動対応付け、右側での数量・人工・基本情報編集、同一PDF画面での連続反映、追加済み行の二重反映防止を追加した版。

### 合格した試験

```text
OK: consulting/design/geology calculation checks passed
OK: consulting UI and report wiring checks passed
OK: document import review UI and safe apply wiring checks passed
OK: document PDF/OCR extraction and review candidate checks passed
OK: regulation audit checks passed (master mapping, precision, quantity formulas, travel, rounding, overhead)
OK: Hiroshima R6-R8 complete annual master audit checks passed
OK: nationwide jurisdiction and verified master catalog checks passed
OK: nationwide R6-R8 standard reference master checks passed
OK: official procurement case matching, XML parsing, and source ledger candidates passed
OK: official case search UI, source ledger, revision warning, and safe static-site wiring passed
OK: MLIT official role price presets R4-R8 and consulting roles R6-R8
OK: UI static wiring checks passed
```

追加検査: `node --check document-import.js`、`git diff --check`合格。

### 実ブラウザー確認

- 文字入り匿名合成PDF 1ページを直接抽出し、11文字行すべてにクリック枠を表示した。自動判定0行でも青い破線の未判定枠として全行を選択できた。
- 「公図等の転写」を模した未判定行を測量項目へ対応付け、抽出数量11、単位「回」、整数のみの入力規則を確認後、測量1件を反映した。
- 別の未判定行を土木設計業務・主任技術者・1人工へ対応付け、設計人工1件を反映した。2回ともPDF取込画面を維持し、追加済み行2行、反映待ち0件となった。
- ローカル版とGitHub Pages公開版でブラウザー警告・エラー0件。公開版で`document-import.js?v=20260822-5`と`styles.css?v=20260822-12`を確認した。

### 主要ファイルのSHA-256

| ファイル | SHA-256 |
|---|---|
| `index.html` | `12193E82986ACA8471F93B0C6F57EA0F6C9563C55BA6741E25DF6B7D88D0C3AA` |
| `styles.css` | `F489DF977FCE9115B689A747826C93A9D6FDA24DF3427DEC2D338FC72A61922F` |
| `document-reader.js` | `E453944BF9F3598DA558D904097B171B6EF386848439E77B2E5A6C99AB49B0A7` |
| `document-import.js` | `571CC812B6BB67996DE6DEA16FB802C8FF9B1C34D533F66762DA99BC9C482E43` |
| `tests/test-document-import.js` | `5DF46E8A67EACC8DFA6CAC4E7D5DA6EFA6BA1B80931765CA1C17D5830AAC2165` |
| `tests/test-document-import-ui.js` | `06D69EB54AA6427B1EAABA8BB09FA46CFD98AC5C405EC5BA830F11D9342C9186` |

## B-2026-08-23-01

- 状態: **検証済み・GitHub Pages公開済み**
- 検証日: 2026-08-23
- アプリコミット: `ae74cb9c0af6a1861935a96af48473d1dee869fb`
- GitHub Pagesビルド: `1168043049`（`built`）
- 公開URL: `https://iku190t.github.io/tokushima-survey-sekisan/`
- 内容: B-2026-08-22-20へ、PDF同一行の文字ブロック・表セル分割、行文脈を使う数量推定、測量分類から詳細項目を絞る操作、小型ファイル投下欄を追加し、貼付け原文解析と公式案件検索・資料台帳UIを廃止した版。

### 合格した試験

```text
OK: consulting/design/geology calculation checks passed
OK: consulting UI and report wiring checks passed
OK: document import review UI and safe apply wiring checks passed
OK: document PDF/OCR extraction and review candidate checks passed
OK: regulation audit checks passed (master mapping, precision, quantity formulas, travel, rounding, overhead)
OK: Hiroshima R6-R8 complete annual master audit checks passed
OK: nationwide jurisdiction and verified master catalog checks passed
OK: nationwide R6-R8 standard reference master checks passed
OK: official procurement case matching, XML parsing, and source ledger candidates passed
OK: official case search UI is removed while saved-data compatibility remains
OK: MLIT official role price presets R4-R8 and consulting roles R6-R8
OK: UI static wiring checks passed
```

追加検査: `node --check document-reader.js`、`node --check document-import.js`、`git diff --check`合格。

### 実ブラウザー確認

- 国土地理院公開PDF7ページを直接抽出し、合計290文字ブロックを表示した。表の同一行は最大10ブロックへ分割され、近接する日本語文字は語単位へ結合された。
- 手動対応の測量項目は全分類で空欄を含む135件、分類「基準点測量」選択後は15件へ絞られることを確認した。
- ローカル版とGitHub Pages公開版でファイル投下欄の高さ132px、貼付け解析欄なし、公式案件検索・資料台帳なしを確認した。
- 公開版で`document-reader.js?v=20260823-1`、`document-import.js?v=20260823-1`、`styles.css?v=20260823-1`を確認し、ブラウザー警告・エラー0件だった。

### 主要ファイルのSHA-256

| ファイル | SHA-256 |
|---|---|
| `index.html` | `7AFB4574D1A2423F52BFF5798E6B80C0D01765179F953CB43EB55101E7DCC1F3` |
| `styles.css` | `DE7A711A99112D497C01C216A84A52054EA60FBFED1FBB975D6DBE3A593375ED` |
| `document-reader.js` | `EA40159534120846D3A7AE3B02F6D04A382C15C893BAF481ADD8EC64891FC330` |
| `document-import.js` | `89B6E7CDAA6B608FA5D9E7ABC4239534D1F39EEB40734ADA82C0AF6B47712A6F` |
| `tests/test-document-import.js` | `2AE125741AC42B9432F199B15E3654EA67931BB6A7037EC7293D72AB92F765E9` |
| `tests/test-document-import-ui.js` | `4A6D51493EC8DEA818B38ADF5BC60F897C20764ACC26753FC811B9F958BE1A16` |
| `tests/test-official-case-ui.js` | `760D164512AD48103DDB5FF5542DBF53B729DB8BC7B7D22E0AE7D1C77770BB5C` |

## B-2026-08-23-02

- 状態: **検証済み・GitHub Pages公開済み**
- 検証日: 2026-08-23
- アプリコミット: `258b0010854d15b6c0448626d0dd71f418d9bece`
- GitHub Pagesビルド: `1168807200`（`built`）
- 公開URL: `https://iku190t.github.io/tokushima-survey-sekisan/`
- 内容: B-2026-08-23-01へ、PDF文字ブロックを右側の項目・数量へ別々にドラッグし、同じ反映候補へまとめる操作を追加した版。クリック操作、分類・詳細選択、単位別数量規則は維持する。

### 合格した試験

```text
OK: consulting/design/geology calculation checks passed
OK: consulting UI and report wiring checks passed
OK: document import review UI and safe apply wiring checks passed
OK: document PDF/OCR extraction and review candidate checks passed
OK: regulation audit checks passed (master mapping, precision, quantity formulas, travel, rounding, overhead)
OK: Hiroshima R6-R8 complete annual master audit checks passed
OK: nationwide jurisdiction and verified master catalog checks passed
OK: nationwide R6-R8 standard reference master checks passed
OK: official procurement case matching, XML parsing, and source ledger candidates passed
OK: official case search UI is removed while saved-data compatibility remains
OK: MLIT official role price presets R4-R8 and consulting roles R6-R8
OK: UI static wiring checks passed
```

追加検査: `node --check document-import.js`、`git diff --check`合格。

### 実ブラウザー確認

- 国土地理院公開PDF7ページをローカルHTTP画面へ読み込み、290文字ブロックを表示した。
- 項目ブロックを右側の「項目」へドラッグし、対応付け欄が開いて項目原文が表示されることを確認した。
- 続けて別の数量ブロックを「数量」へドラッグし、項目原文と数量原文が別々に表示され、数量入力へ候補値が入ることを確認した。
- 最初のドロップ前後で次の数量ブロックの画面座標が不変であり、PDF位置を維持して連続操作できた。ローカル版のブラウザー警告・エラー0件。
- GitHub Pages公開版で項目・数量の受け皿と`document-import.js?v=20260823-2`を確認し、ブラウザー警告・エラー0件だった。

### 主要ファイルのSHA-256

| ファイル | SHA-256 |
|---|---|
| `index.html` | `3C0C978737F88B6F4A171EE6720FE811D2676B106106DCA6CDE061796736924C` |
| `styles.css` | `82825D7AEFCA58E55E4642031F720A6AB49D90D46F186A934B141E3F867BF909` |
| `document-import.js` | `BE14DE8628DD5BCD4DF4F1C461B1A3F91A701634C7F4D4513187AC015381BFBF` |
| `tests/test-document-import-ui.js` | `5093860212E2205D973FFFC4E2CB322F91DC4EE3FD06A7693AD4EF9E4C51BF08` |

## B-2026-08-23-03

- 状態: **検証済み・GitHub Pages公開済み**
- 検証日: 2026-08-23
- アプリコミット: `78cc339c6bc5b4778ffa92e13337e5d43126df16`
- GitHub Pagesビルド: `1168854504`（`built`）
- 公開URL: `https://iku190t.github.io/tokushima-survey-sekisan/`
- 内容: B-2026-08-23-02へ、取込画面名の統一、PDF反映待ち項目と積算内訳のクリック変更、アクセス解析ポップアップ廃止と公開HTTPS版ページビュー常時計測を追加した版。

### 合格した試験

```text
OK: consulting/design/geology calculation checks passed
OK: consulting UI and report wiring checks passed
OK: document import review UI and safe apply wiring checks passed
OK: document PDF/OCR extraction and review candidate checks passed
OK: regulation audit checks passed (master mapping, precision, quantity formulas, travel, rounding, overhead)
OK: Hiroshima R6-R8 complete annual master audit checks passed
OK: nationwide jurisdiction and verified master catalog checks passed
OK: nationwide R6-R8 standard reference master checks passed
OK: official procurement case matching, XML parsing, and source ledger candidates passed
OK: official case search UI is removed while saved-data compatibility remains
OK: MLIT official role price presets R4-R8 and consulting roles R6-R8
OK: UI static wiring checks passed
```

追加検査: `node --check app.js`、`node --check document-import.js`、`git diff --check`合格。

### 実ブラウザー確認

- ローカルHTTP画面で「PDF・写真から取込み」の名称、アクセス解析ポップアップ0件を確認した。
- 国土地理院公開PDFを読み込み、299文字ブロックを表示した。未判定行から手動候補を1件追加し、その反映待ち項目をクリックして別項目・数量へ変更した。変更後も候補は1件で重複しなかった。
- 積算内訳へ追加した測量項目を作業項目選択欄から変更し、コード・標準歩掛・数量表示が変更先へ更新された。ローカル版のブラウザー警告・エラー0件。
- GitHub Pages公開版で取込画面名、同意ポップアップ0件、GAタグ読込み、`app.js?v=20260823-1`、`document-import.js?v=20260823-3`を確認した。積算内訳の項目変更も実行し、ブラウザー警告・エラー0件だった。

### 主要ファイルのSHA-256

| ファイル | SHA-256 |
|---|---|
| `index.html` | `6C22DB8DAEF5AFCAEEAE4F099EB02C6FE620ECF14D5FD51AB00864A612C6A67F` |
| `app.js` | `7D46438DAC3516A20085CD8088FF2F312EC1E86C603A7BC9344FF33937DEFFF1` |
| `document-import.js` | `3D2A6F37E571AB46BF2DF8558B28F335E82435FF468066FC989D364992FED755` |
| `analytics.js` | `C49B11C4A805BF3587B5E251E232791041BBB6CCB882F6C3109361D8F57AAA8B` |
| `styles.css` | `893A835FBB33DE82265B15A3454053DBC19E5AD4FCAB0D98F5E0E41E582919B6` |
| `tests/test-ui-static.js` | `25F17D077255E2ABBEE9A1758AA09BF31893B839C65FF386E33B9C62CD35B37A` |
| `tests/test-document-import-ui.js` | `2C3605747796C7E1243AECAADC7C2D8B0DB90A00FEA8971398880683C205BFA4` |

## B-2026-08-23-04

- 状態: **検証済み・GitHub Pages公開済み**
- 検証日: 2026-08-23
- アプリコミット: `ab35d40e25ac501a72f663027e0240c9b2db6d0a`
- GitHub Pagesビルド: `1168926002`（`built`）
- 公開URL: `https://iku190t.github.io/tokushima-survey-sekisan/`
- 内容: B-2026-08-23-03へ、重複した別置きドロップ欄の廃止、詳細項目・数量・単位の実入力欄へのドラッグ、資料単位から積算基準単位への換算を追加した版。

### 合格した試験

```text
OK: consulting/design/geology calculation checks passed
OK: consulting UI and report wiring checks passed
OK: document import review UI and safe apply wiring checks passed
OK: document PDF/OCR extraction and review candidate checks passed
OK: regulation audit checks passed (master mapping, precision, quantity formulas, travel, rounding, overhead)
OK: Hiroshima R6-R8 complete annual master audit checks passed
OK: nationwide jurisdiction and verified master catalog checks passed
OK: nationwide R6-R8 standard reference master checks passed
OK: official procurement case matching, XML parsing, and source ledger candidates passed
OK: official case search UI is removed while saved-data compatibility remains
OK: MLIT official role price presets R4-R8 and consulting roles R6-R8
OK: UI static wiring checks passed
```

追加検査: `node --check document-import-engine.js`、`node --check document-import.js`、`git diff --check`合格。

### 実ブラウザー確認

- 国土地理院公開PDFをローカルHTTP画面へ読み込み、別置きドロップ欄0件、実入力マッパーが初期表示されることを確認した。
- 用地測量「公図等の転写」を選び、資料数量6.9、資料単位10,000m²を入力すると「6.9 × 10,000m² ＝ 69,000m²（積算へ反映）」と表示された。
- 反映待ちには69,000m²と資料表記6.9×10,000m²の両方が表示され、積算へ追加後の数量入力は69,000m²だった。ブラウザー警告・エラー0件。
- GitHub Pages公開版で別置きドロップ欄0件、単位入力・換算結果要素、`styles.css?v=20260823-3`、`document-import-engine.js?v=20260823-1`、`document-import.js?v=20260823-4`を確認し、ブラウザー警告・エラー0件だった。

### 主要ファイルのSHA-256

| ファイル | SHA-256 |
|---|---|
| `index.html` | `A8409349B588549A8B418901E667C1CAAB006309817163C7DE431AFAA432883F` |
| `document-import-engine.js` | `06D517BD663120F137B26DB9891A03B7C62ED6171A05CBD10132A956E6AC79E4` |
| `document-import.js` | `92B8FF4412D96D20F4F7EF17951907AA4F1215CA5E52E68FF2656737AF58D8B4` |
| `styles.css` | `8E8EAFEB34A9C61EFDFBD6A7A186CCEE64D08364C9C5F730891B357AC4AE3F3A` |
| `tests/test-document-import.js` | `C228343DA3E4433678934EF652B5265080EB7D36886D30C70A763B61E3A9F9A0` |
| `tests/test-document-import-ui.js` | `209A5F41F978F4E186C10E63BFD020356DF99E505AB35EB1D9F65579066BAED7` |

## B-2026-08-23-05

- 状態: **検証済み・GitHub Pages公開済み**
- 検証日: 2026-08-23
- アプリコミット: `a0d3c7b11b32e74af5f2112cab34432729ebf20f`
- GitHub Pagesビルド: `1168990713`（`built`）
- 公開URL: `https://iku190t.github.io/tokushima-survey-sekisan/`
- 内容: B-2026-08-23-04へ、PDF右側入力欄の上端固定と、反映待ち件数・候補一覧・反映操作のPDF下部への分離を追加した版。

### 合格した試験

```text
OK: consulting/design/geology calculation checks passed
OK: consulting UI and report wiring checks passed
OK: document import review UI and safe apply wiring checks passed
OK: document PDF/OCR extraction and review candidate checks passed
OK: regulation audit checks passed (master mapping, precision, quantity formulas, travel, rounding, overhead)
OK: Hiroshima R6-R8 complete annual master audit checks passed
OK: nationwide jurisdiction and verified master catalog checks passed
OK: nationwide R6-R8 standard reference master checks passed
OK: official procurement case matching, XML parsing, and source ledger candidates passed
OK: official case search UI is removed while saved-data compatibility remains
OK: MLIT official role price presets R4-R8 and consulting roles R6-R8
OK: UI static wiring checks passed
```

追加検査: `git diff --check`合格。

### 実ブラウザー確認

- 国土地理院公開PDFをローカルHTTP画面へ読み込み、PDFと右側入力欄の上端差が0pxであることを確認した。
- 反映待ちを1件から4件まで増やした後も上端差0pxを維持し、反映待ち領域はPDF左右レイアウトの14px下に表示された。ブラウザー警告・エラー0件。
- GitHub Pages公開版で右側に入力欄だけ、反映待ち一覧が右側列外にあること、`styles.css?v=20260823-4`、ブラウザー警告・エラー0件を確認した。

### 主要ファイルのSHA-256

| ファイル | SHA-256 |
|---|---|
| `index.html` | `5A6D813FD80EBA1380CD217B6EE50BA2822FA3F28CB4923D8318814FEBD1A2FA` |
| `styles.css` | `DEC9952BE3FBA82BDCF7350DC4DC51D49AE5A6616272EA8CBBC64F79CA4A9A02` |
| `tests/test-document-import-ui.js` | `09534AFB698D332BA01EC8781815C85462C1135D02367A9F82DEDA7C895F4276` |
