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

## B-2026-08-23-06

- 状態: **検証済み・GitHub Pages公開済み**
- 検証日: 2026-08-23
- アプリコミット: `fd12839a71eda8e260cf8038b964e7bba91aeaca`
- GitHub Pagesビルド: `1169011198`（`built`）
- 公開URL: `https://iku190t.github.io/tokushima-survey-sekisan/`
- 内容: B-2026-08-23-05へ、PDF反映先の4業務区分化、区分別候補絞込み、PDF作業領域の全幅化、項目・数量・単位ドロップ先の常時強調を追加した版。

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

- 国土地理院公開PDFをローカルHTTP画面へ読み込み、5選択肢の順序、測量の非航空分類、航空船舶の6分類・57項目、設計2区分、地質2区分を確認した。
- 幅1280pxでPDF作業カード1188px、PDF欄806px、右入力欄330px、間隔12px。項目・数量・単位の3ドロップ先は番号、説明、緑色2px破線で常時表示された。ブラウザー警告・エラー0件。
- GitHub Pages公開版で5選択肢、3ドロップ先、作業カード左右余白0px、`styles.css?v=20260823-5`、`app.js?v=20260823-2`、`document-import.js?v=20260823-5`を確認した。

### 主要ファイルのSHA-256

| ファイル | SHA-256 |
|---|---|
| `app.js` | `7171C4C6B1DFA69448BA1800200F6AF81691CD303956D88DBA57BE92AB1820EA` |
| `document-import.js` | `3AB0C4B21B4349DBD4D0E1C1B409CB4A733062767C9362EF42E64CFCB4D8641A` |
| `index.html` | `64C97AB93F3CE799E204B2C1069E0BD527C21666C8FFB943D450907724E3DDA4` |
| `styles.css` | `47D7F603146A9390EFBC7AD7A3476981C7D2A76BB0608C2B856C0F40F3DF652D` |
| `tests/test-document-import-ui.js` | `939596A4B8E339212E69F9F86997D5EEC3CA2EBF197ADC1B22C449CEF04B6DBF` |

## B-2026-08-23-07

- 状態: **検証済み・GitHub Pages公開済み**
- 検証日: 2026-08-23
- アプリコミット: `22895a13b8b85f79fb7c1ceaa2e038ef2e8f236f`
- GitHub Pagesビルド: `1169042409`（`built`）
- 公開URL: `https://iku190t.github.io/tokushima-survey-sekisan/`
- 内容: B-2026-08-23-06へ、設計・地質の詳細項目選択、PDF取込への同じ選択肢、航空・船舶6分類の明示、令和8年度UAVレーザ測量8工程の公式展開を追加した版。

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
OK: R8 UAV laser detailed work item expansion checks passed
```

追加検査: `node --check app.js`、`node --check consulting.js`、`node --check document-import.js`、`node --check data/verified-work-item-expansions.js`、`git diff --check`合格。

### 実ブラウザー確認

- 設計業務に11詳細項目、地質解析に11詳細項目、地質一般に14詳細項目を表示し、選択時に内訳名称が更新された。
- 公開PDFを読み込み、PDF取込で設計・地質の業務区分別詳細項目、職種、人工を同じ画面から選べた。入力欄315px内で横あふれなし、ページ全体の横あふれなし、ブラウザー警告・エラー0件。
- 令和8年度の航空・船舶関係は64項目、UAVレーザ測量は作業計画と8工程を表示した。計測工程0.1km²の直接人件費484,710円、適用上限0.2km²、機械経費等・精度管理費の別途確認表示を確認した。
- GitHub Pages公開版で航空・船舶64項目、UAVレーザ9選択肢、設計・地質の詳細項目、`verified-work-item-expansions.js?v=20260823-1`、ブラウザー警告・エラー0件を確認した。

### 主要ファイルのSHA-256

| ファイル | SHA-256 |
|---|---|
| `app.js` | `2B5BF5801E34E395B4F6661B3746DF77F60BB9A978C1CC255EF9BC10603E5D00` |
| `consulting.js` | `5BE602FF66664828AC180AC9C4BCAF5CF9FEC72DA37D48D681A7E782FA3D966F` |
| `data/consulting-master.js` | `D1F9630909D31945358695DC8B17A26C3438E5014D25501F68C622385E463D5C` |
| `data/verified-work-item-expansions.js` | `8F64574DADFC1431029EAAF2213D1ADFE858866B7AA551544797AD4BC5545EF4` |
| `document-import.js` | `B26D51EE743F6B7532807C0811811E79CF0B727C7ED7BD53B527F330DD667BA0` |
| `index.html` | `277D618A965265C2333A5178C098D68D01AA6A2012BA9994AB133487293933E4` |
| `styles.css` | `760255E26BD18BC3FF2BAFE27AB57A5448B6E83F9C8970B7AE7B1C59DB65B3B6` |
| `tests/test-work-item-expansions.js` | `6F2418DBB463D001E0DAFD8E9867FF80362C24DB8DDE1CF5B4A4A956FC44FB87` |

## B-2026-08-23-08

- 状態: **検証済み・GitHub Pages公開済み**
- 検証日: 2026-08-23
- アプリコミット: `3752520d675ad51227ba4349137a520be3a1f2d9`
- 公開コミット: `1c3e7bc4b9767a69c7450ad411617a20bf55eb6f`
- GitHub Pagesビルド: `1169066467`（`built`）
- 公開URL: `https://iku190t.github.io/tokushima-survey-sekisan/`
- 内容: B-2026-08-23-07へ、主要業務積算製品と公式積算基準体系の横断調査、国交省一般と港湾・航空局・用地・農林・上下水道等の別体系表示、航空測量／空港・深浅測量／港湾船舶の混同防止を追加した版。

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
OK: R8 UAV laser detailed work item expansion checks passed
```

追加検査: `node --check app.js`、`node --check consulting.js`、`node --check document-import.js`、`git diff --check`合格。

### 実ブラウザー確認

- 「使い方・計算根拠」で対応表を開き、7基準体系、公式リンク6本、一部自動計算1件、別体系・未収録6件を確認した。
- 幅1265pxでページ幅とスクロール幅がともに1265pxとなり、ページ全体の横あふれなし。
- 航空・船舶タブで国交省一般の収録6分類と、航空局・港湾基準・船舶損料を一括収録していない説明を確認した。ブラウザー警告・エラー0件。

### 主要ファイルのSHA-256

| ファイル | SHA-256 |
|---|---|
| `app.js` | `EFDCA81A49D801DC6C1B06649D26B7B75A418FC2DC0EA8161AAE21545870B8CD` |
| `index.html` | `2E11EF146856CF525144F804D6B2964BDEB9837CEB84B305B7417F44E2D3F504` |
| `styles.css` | `030F3AEF9203E1B619ACC1B256816933FCAFD5B6ABB9E0101597FAFEE4C27E19` |
| `tests/test-ui-static.js` | `111B6E25F8A2E8E1787FFB2A76C145E09AEB5560C75AFA4D811A8FDECD358D91` |
| `業務積算ソフト製品・基準体系調査.md` | `92F468DB5C6A84D4AD73FDAA6279A523E377C4795571AA5939B224F32A24A9F6` |

## B-2026-08-23-09

- 状態: **検証済み・GitHub Pages公開済み**
- 検証日: 2026-08-23
- アプリコミット: `415d5b238a9d381334b87dec92d080aa8cf91305`
- GitHub Pagesビルド: `1169097322`（`built`）
- 公開URL: `https://iku190t.github.io/tokushima-survey-sekisan/`
- 内容: B-2026-08-23-08へ、Survey Plan型の見積提出先／全国標準単価セット分離、徳島県・県別マスターの通常画面非読込、全国標準R6～R8だけの配信カタログ、旧徳島県保存データの全国標準移行を追加した版。

### 合格した試験

```text
OK: consulting/design/geology calculation checks passed
OK: consulting UI and report wiring checks passed
OK: document import review UI and safe apply wiring checks passed
OK: document PDF/OCR extraction and review candidate checks passed
OK: regulation audit checks passed (master mapping, precision, quantity formulas, travel, rounding, overhead)
OK: Hiroshima R6-R8 complete annual master audit checks passed
OK: nationwide submission destinations and standard master catalog checks passed
OK: nationwide R6-R8 standard reference master checks passed
OK: official procurement case matching, XML parsing, and source ledger candidates passed
OK: official case search UI is removed while saved-data compatibility remains
OK: MLIT official role price presets R4-R8 and consulting roles R6-R8
OK: UI static wiring checks passed
OK: R8 UAV laser detailed work item expansion checks passed
```

追加検査: `node --check app.js`、`node --check document-import-engine.js`、`node --check document-import.js`、`node --check consulting.js`、`git diff --check`合格。

### 実ブラウザー確認

- 新規画面は見積提出先未設定、`standard-r8-2026`。単価セット選択肢は令和8・7・6年度の国土交通省・全国標準3件だけで、県別マスタースクリプトは読み込まない。
- ローカルHTTP版で2級基準点10点を追加し、提出先未設定と徳島県で税込合計7,616,400円・マスター`standard-r8-2026`が不変。徳島県を維持して令和7年度へ切り替えると`standard-r7-2025`・7,491,000円になった。
- GitHub Pages公開版で同じ令和8年度計算を提出先未設定と北海道で比較し、税込合計7,616,400円・マスター`standard-r8-2026`が不変。ページ幅とスクロール幅は1265px、ブラウザー警告・エラー0件。

### 主要ファイルのSHA-256

| ファイル | SHA-256 |
|---|---|
| `app.js` | `3DD9C644664ECCE94F333DC7BC46FC91CAD647E25D58350117E147E202EF5555` |
| `consulting.js` | `0064314C14B773D9C25086B97B1DCBE7855891F16436E21B6205116101AF62F3` |
| `document-import-engine.js` | `7CA8EBBA851F6F5330DDBF0BB36362E90AD605D69839A446884A8D8B03C6839B` |
| `document-import.js` | `9DDDEA135EDE1F7760B2408D3DE5B7D3C9FED45E2B6263952F5DA6CFB3C58085` |
| `index.html` | `055F8A7251AD8E7A0F3802C67F8C0370B38AD843E185F70877DD66F7C9833D18` |
| `data/master-catalog.json` | `B0DB05E5239F9E9194068EA9A370A44204CED676862CAAAE564CBD22A19AAE20` |
| `data/prefectures.js` | `850BAB880C3FD863BF080DC2A9D3268788A28AE19B5F30824437ABAFACF3EF6C` |
| `tests/test-ui-static.js` | `C16C536E13C54A8A57D51F66C6097225D02E49D89CA45E98CDEF74E832B186B8` |
| `tests/test-master-catalog.js` | `25BE14F75E3994AF542669FA23D18B60656C0AB2A14B800572A4439C6E58D062` |

## B-2026-08-23-10

- 状態: **検証済み・GitHub Pages公開済み**
- 検証日: 2026-08-23
- アプリコミット: `f0b23cc5495e00f17e4ec928881df5617f82d606`
- GitHub Pagesビルド: `1169138934`（`built`）
- 公開URL: `https://iku190t.github.io/tokushima-survey-sekisan/`
- 内容: B-2026-08-23-09へ、積算基準の4業務区分、測量の作業規程第2～5編分類、航空・UAV・レーザ・深浅測量の測量内統合、設計等の詳細項目・職種・人工ドラッグを追加した版。

### 合格した試験

```text
OK: consulting/design/geology calculation checks passed
OK: consulting UI and report wiring checks passed
OK: document import review UI and safe apply wiring checks passed
OK: document PDF/OCR extraction and review candidate checks passed
OK: regulation audit checks passed (master mapping, precision, quantity formulas, travel, rounding, overhead)
OK: Hiroshima R6-R8 complete annual master audit checks passed
OK: nationwide submission destinations and standard master catalog checks passed
OK: nationwide R6-R8 standard reference master checks passed
OK: official procurement case matching, XML parsing, and source ledger candidates passed
OK: official case search UI is removed while saved-data compatibility remains
OK: MLIT official role price presets R4-R8 and consulting roles R6-R8
OK: UI static wiring checks passed
OK: R8 UAV laser detailed work item expansion checks passed
```

追加検査: `node --check app.js`、`node --check consulting.js`、`node --check document-import.js`、`git diff --check`合格。

### 実ブラウザー確認

- ローカル版で上位タブを設計・測量・調査計画・地質の順に表示し、設計は土木設計だけ、調査計画は調査・計画だけへ分離した。
- 令和8年度測量141項目を積算共通5、第2編20、第3編24、第4編35、第5編57へ分類し、合計141・未分類0件。深浅測量の根拠表示は「作業規程 第5編 第3章 第7節」だった。
- 公開版で4タブ、5作業規程分類、141項目、更新済みCSS／JSを確認した。ページ幅とスクロール幅は1265px、ブラウザー警告・エラー0件。

### 主要ファイルのSHA-256

| ファイル | SHA-256 |
|---|---|
| `index.html` | `BE4AED99BB97050F53DD536AC076C3140F12C9A3E17748078F25CEC01DB51558` |
| `app.js` | `289F125ED3D7D78116C31011753ADE3E4A00428E742CCD54A21DC58FA688600B` |
| `consulting.js` | `938E6B3A66AAB9237DB979A5C1CF8DF8E43C5DBFED80EA0C6917CBBB91E7A876` |
| `document-import.js` | `67AAF2C655AC1DB21F4A3A5597F0FD42C1D21A53CCB44F89EC6B0217BFD86103` |
| `styles.css` | `700C274F9A5C244551040429D1EF7C2C897FD23697423A7A2F9DEB9C9541E434` |
| `tests/test-ui-static.js` | `7CD2BBE6B8E82E84458907089374AD882CEF0CCC49ECD483AE49C78956C90974` |
| `tests/test-consulting-ui.js` | `6863CA3748BD31A7E016ACFC81451C6A133C89622153CB84331DE066EFB973DF` |
| `tests/test-document-import-ui.js` | `0D2D63B72E9D37425BFF000DD3FEECEFE701E81C894B0ADD4C9DD01DBABD3D7D` |

## B-2026-08-23-11

- 状態: **検証済み・GitHub Pages公開済み**
- 検証日: 2026-08-23
- アプリコミット: `8c037c4a4c5e851864068143be150f94b5667dca`
- GitHub Pagesビルド: `1169197989`（`built`）
- 公開URL: `https://iku190t.github.io/tokushima-survey-sekisan/`
- 内容: B-2026-08-23-10へ、国交省令和6～8年度の公式掲載資料24件の年度別台帳、公開全編から抽出した設計・調査計画・地質の職種別標準歩掛735表、年度・業務タブ・検索語・標準単位・出典ページ・数量倍率による追加、年度連動の画面／帳票出典を追加した版。

### 合格した試験

```text
OK: regulation audit checks passed (master mapping, precision, quantity formulas, travel, rounding, overhead)
OK: MLIT official role price presets R4-R8 and consulting roles R6-R8
OK: UI static wiring checks passed
OK: nationwide submission destinations and standard master catalog checks passed
OK: Hiroshima R6-R8 complete annual master audit checks passed
OK: nationwide R6-R8 standard reference master checks passed
OK: consulting/design/geology calculation checks passed
OK: consulting UI and report wiring checks passed
OK: R6-R8 consulting/planning/geology source-table walks and MLIT source catalog checks passed
OK: R8 UAV laser detailed work item expansion checks passed
OK: document PDF/OCR extraction and review candidate checks passed
OK: document import review UI and safe apply wiring checks passed
OK: official procurement case matching, XML parsing, and source ledger candidates passed
OK: official case search UI is removed while saved-data compatibility remains
```

追加検査: `node --check app.js`、`node --check consulting.js`、`node --check document-import-engine.js`、`node --check document-import.js`、生成データ2件、`git diff --check`合格。

### 実ブラウザー確認

- GitHub Pages公開版の令和8年度・設計業務で184候補（既存確認済み1件を含む、全区分250表）を表示し、「道路詳細設計（A）」検索でp.151の1km当り表だけへ絞り込んだ。
- 同表を追加すると、理事・技師長0.2、主任技師2.9、技師(A)9.8、技師(B)20.8、技師(C)28.2、技術員28.2となり、直接人件費4,094,530円、設計業務価格9,691,193円、税込10,660,312円だった。
- 計算根拠は令和8年度の技術者単価、年度別全編、同年度8資料、国交省年度別ページを表示した。ローカル版では令和7年度へ切り替えると候補p.150、同年度資料11リンクへ変わった。公開版のブラウザー警告・エラー0件。

### 主要ファイルのSHA-256

| ファイル | SHA-256 |
|---|---|
| `index.html` | `024DFB7CB3A0CE2B8845FADB6DD2BA33FDD59A88D5F001EA89A764A76FDF8BCF` |
| `consulting.js` | `939BB018AB688883461E275333EAF9BC5106CAD9B070060AE4D586F55EA79C85` |
| `data/consulting-master.js` | `D1B10D900E14DA6FBEBDC79B791231E07795C22CF56ABA5880972534B0DE08E1` |
| `data/consulting-standard-walks.json` | `6119F1072CB0EB6C71C6E4C66F24C5ED201BD8FB71BFCE4101FEC59E9C1BCDD6` |
| `data/consulting-standard-walks.js` | `1516EF71D6945C442E78845C8E0D01F1AB52A2666AA958FDB958D8B6C8B6F097` |
| `data/official-source-catalog.json` | `EB52EB7B5DC44F063A3E8A433FEF820F16776622FAC74D0306C9815203515B58` |
| `data/official-source-catalog.js` | `5ED19F6A1ACCF8C4EE6333C27D0917425144526F0E71CE014DA4F51866312130` |
| `styles.css` | `19B0FD94655B67D9B3AA3723B5439A9D062E8B747A6AF4DCFDAF80A8E08D6E53` |
| `tests/test-consulting-ui.js` | `E436796D8109B8EA9B6C73C4ECCCD30E63871C13FB4C377CD9A538502D4E7EBE` |

| `tests/test-consulting-walks.js` | `888BCE2AF68CD0068E648DD5949C29E9D7E1DD9A857D5A78528371B378657FEB` |
| `tools/generate-consulting-walks.py` | `A0ABBF475A46A184C338EE1436C500AE317A6C3514AC0D231C18F22001DCC1FA` |
| `tools/update-mlit-source-catalog.py` | `13862E2F17B53DA9010B31E8247AC2C1BBF70474ED57AF7849B59EEC3BF1A0B6` |

## B-2026-08-23-12

- 状態: **検証済み・GitHub Pages公開済み**
- 検証日: 2026-08-23
- アプリコミット: `972e9ff862d5ceb07b4c70675760d73cfbeac9f0`
- GitHub Pagesビルド: `1169236470`（`built`）
- 公開URL: `https://iku190t.github.io/tokushima-survey-sekisan/`
- 内容: 計算根拠をリンク箇条書きから、採用した歩掛→根拠PDF・原表ページ対応表と年度別公式PDF台帳へ拡張した版。測量明細は年度別公開全編の該当ページへリンクし、測量の積算条件書と設計等の総合帳票にも資料名・用途・頁数・確認状態の表を出す。取得・索引済みと計算採用を区別する。

### 合格した試験

```text
OK: regulation audit checks passed (master mapping, precision, quantity formulas, travel, rounding, overhead)
OK: MLIT official role price presets R4-R8 and consulting roles R6-R8
OK: UI static wiring checks passed
OK: nationwide submission destinations and standard master catalog checks passed
OK: Hiroshima R6-R8 complete annual master audit checks passed
OK: nationwide R6-R8 standard reference master checks passed
OK: consulting/design/geology calculation checks passed
OK: consulting UI and report wiring checks passed
OK: R6-R8 consulting/planning/geology source-table walks and MLIT source catalog checks passed
OK: R8 UAV laser detailed work item expansion checks passed
OK: document PDF/OCR extraction and review candidate checks passed
OK: document import review UI and safe apply wiring checks passed
OK: official procurement case matching, XML parsing, and source ledger candidates passed
OK: official case search UI is removed while saved-data compatibility remains
```

追加検査: `node --check app.js`、`node --check consulting.js`、`git diff --check`合格。

### 実ブラウザー確認

- ローカル版で令和8年度「道路詳細設計（A）」1km当りが、令和8年度公開全編p.151へ対応することを確認した。
- 「使い方・計算根拠」の令和7年度台帳は11件へ切り替わり、令和8年度資料が混在しないことを確認した。
- 公開版は`app.js?v=20260823-8`、`consulting.js?v=20260823-5`を読み込み、令和8年度台帳12件、技術者単価7頁・計算採用の表示、ブラウザー警告・エラー0件を確認した。

### 主要ファイルのSHA-256

| ファイル | SHA-256 |
|---|---|
| `app.js` | `AE38B9F5E47D318F448D1B2AA46233E293A3B8021C839522924A7BBC07CC4EAC` |
| `consulting.js` | `468D090F2B5F838A5FF44D8372B746AEF8A8FFFF23A7629CC5371693B0889697` |
| `index.html` | `6AFD3BFA0351B3D92293C40425782303CAFD0068EE9D39F83DA88FCD5CB124B8` |
| `styles.css` | `879E7E86300618F7671A36795A2671F5CE4DDAC574028DB5A04990CA23F006FF` |
| `tests/test-ui-static.js` | `EE7046D3FFB6AFC3247C09E4BD38CFC0B5AC41307327A256239731DBEB50C7F7` |
| `tests/test-consulting-ui.js` | `E648962CFB2E1C5C05CE6DBECB6478DF66A61656A006D15A7A36C20B22720B5D` |

## B-2026-08-23-13

- 状態: **検証済み・GitHub Pages公開済み**
- 検証日: 2026-08-23
- アプリコミット: `df9e55b044d3631bdeee7ca5ac64aa9a48ac4879`
- GitHub Pagesビルド: `1169284830`（`built`）
- 公開URL: `https://iku190t.github.io/tokushima-survey-sekisan/`
- 内容: B-12の全業務資料台帳という誤った範囲拡張を撤回し、測量項目の選択直下だけに使用規定書・原PDF・該当ページ表を追加した版。年度一覧も全国標準測量マスターが使用・照合する4資料だけを表示する。

### 合格した試験

```text
OK: regulation audit checks passed (master mapping, precision, quantity formulas, travel, rounding, overhead)
OK: MLIT official role price presets R4-R8 and consulting roles R6-R8
OK: UI static wiring checks passed
OK: nationwide submission destinations and standard master catalog checks passed
OK: Hiroshima R6-R8 complete annual master audit checks passed
OK: nationwide R6-R8 standard reference master checks passed
OK: consulting/design/geology calculation checks passed
OK: consulting UI and report wiring checks passed
OK: R6-R8 consulting/planning/geology source-table walks and MLIT source catalog checks passed
OK: R8 UAV laser detailed work item expansion checks passed
OK: document PDF/OCR extraction and review candidate checks passed
OK: document import review UI and safe apply wiring checks passed
OK: official procurement case matching, XML parsing, and source ledger candidates passed
OK: official case search UI is removed while saved-data compatibility remains
```

追加検査: `node --check app.js`、`node --check consulting.js`、`git diff --check`合格。

### 実ブラウザー確認

- 令和8年度「2級基準点測量 新点10点 伐採有り」で、歩掛原表p.23、直接経費率p.105、国交省測量業務積算基準、国交省技術者単価、国土地理院作業規程資料の4リンクを確認した。
- 作業規程上の分類は「第2編 第2章 基準点測量」、年度一覧は測量マスターの4資料だけだった。
- 公開版は`app.js?v=20260823-9`、`consulting.js?v=20260823-6`を読み込み、設計等へ追加した資料表がないこと、ブラウザー警告・エラー0件を確認した。

### 主要ファイルのSHA-256

| ファイル | SHA-256 |
|---|---|
| `app.js` | `3A812AD5DC3F0FAB4A2EC6BECF9BC5AB9606BEB435756181D9F04F411249BF42` |
| `consulting.js` | `939BB018AB688883461E275333EAF9BC5106CAD9B070060AE4D586F55EA79C85` |
| `index.html` | `1732AD9F859B97B0401E889DAAF1326D21BF05774E2FA74C1664A2CD8D1C2039` |
| `styles.css` | `C526A3B74351D7A2B3DA18503D6ADBF00568CC7E44EA72AEDE88A892BB90DFD2` |
| `tests/test-ui-static.js` | `E8AA6C8BB656D795E8E0D9EB2FD7FB4C7308490589A42DB329A1287AB41EB5CB` |
| `tests/test-consulting-ui.js` | `E436796D8109B8EA9B6C73C4ECCCD30E63871C13FB4C377CD9A538502D4E7EBE` |

## B-2026-08-23-14

- 状態: **検証済み・GitHub Pages公開済み**
- 検証日: 2026-08-23
- 実装コミット: `bc9896d30ef23f10df937d6372e3a22dcf426ac6`
- GitHub Pagesビルド: `1169934550`（`built`）
- 公開URL: `https://iku190t.github.io/tokushima-survey-sekisan/`
- 内容: 国交省年度別ページの基準書本体・参考資料・年度改定を全リンク監査し、人工・補正係数・PDF取込数量の桁数と空欄初期値を安全側へ修正した版。

### 原資料監査

- ページ内171リンク、PDFリンク155件、重複除外PDF152件を目録化した。
- 152件すべて取得成功、合計3,054ページ、176,433,922バイト。各PDFのURL、リンク名、頁数、容量、SHA-256を記録した。
- 平成23年度の標準積算基準書第1～4編と参考資料、平成26年度参考資料改定、令和8年度改定を基準書本体・継続適用部分・年度改定として区別した。
- 取得・索引済みと全計算式実装済みを同一状態にしないことをD-031へ記録した。

### 合格した試験

- `tests/test-*.js` 全14本合格。
- `node --check` は `consulting.js`、`document-import.js`、`consulting-engine.js`、`document-import-engine.js`で合格。
- `python -m py_compile` は公式資料台帳2スクリプトで合格。
- `git diff --check` 合格。

### 実ブラウザー確認

- 新規画面で人工、補正係数、PDF数量、PDF人工、PDF単位がすべて空欄であることを確認した。
- 人工1.2345は1.235、補正係数1.236は1.24へ補正された。
- 補正係数が空欄の場合、標準歩掛は追加されず、入力要求を表示した。
- 設計業務の出典に第3編、参考資料第4編、参考資料第1編、平成26年度端数規定改定を表示した。ブラウザーエラー0件。
- 公開版が`engine.js?v=20260823-2`、`consulting-engine.js?v=20260823-2`、`document-import-engine.js?v=20260823-2`、`consulting.js?v=20260823-7`、`document-import.js?v=20260823-9`を読み込み、同じ空欄初期値とブラウザーエラー0件を確認した。

### 主要ファイルのSHA-256

| ファイル | SHA-256 |
|---|---|
| `index.html` | `FCBADE3589BCDC58007F0C24C46BC376387CC4DA533B06F8F11961116C25BFB6` |
| `consulting.js` | `7021592A6C01034EC71520AF11F207E6298B81F6ABF1D122F97B38401805CD58` |
| `document-import.js` | `2BFD5D0F07D1584755B7D4D5D84C8AAF8CB93531A8F3857498B153CE3EA0D220` |
| `engine.js` | `0CCCF76F84D647A8150DCDC3870B39AC89660DBEDCD9AEE7B521C0A5FA82CC48` |
| `mlit-gyoumu-sekisan-documents.json` | `7AD1BB7EE0C2048EACEEF95683B50AADA5394C23A22ABB75198A1EF9728C07C0` |
| `tests/test-master-catalog.js` | `CA03A0C302CF2931D743F5B700CEF66F9A2C3DDDF1CF391614146CB3B8F90E79` |

## B-2026-08-24-01

- 状態: **検証済み・GitHub Pages公開済み**
- 検証日: 2026-08-24
- 実装コミット: `c8f23c337aa84e775a6c0472cafe8b5029eb3a55`
- GitHub Pagesビルド: `1169965717`（`built`）
- 公開URL: `https://iku190t.github.io/tokushima-survey-sekisan/`
- 内容: 全国対応画面に混在していた広島県専用マスター、専用出典、監査データ、生成ツール、専用テストを削除し、国交省の全国資料だけを参照する構成へ整理した版。

### 確認済みの境界

- 計算マスターと出典台帳に広島県専用データは0件。
- 全国47都道府県の提出先一覧には、全国対応に必要な選択肢として広島県を残す。
- 全国標準歩掛の数値候補は残すが、現行全編の原表ページを照合できていない項目を「検証済み」と表示しない。
- 過去の判断・障害記録は履歴として保持し、現行データと区別する。

### 合格した試験

- `tests/test-*.js` 全13本合格。
- `node --check` は `app.js`、`consulting.js`、`data/national-standard-masters.js`、`data/official-source-catalog.js`、`data/consulting-standard-walks.js`で合格。
- 実行時ファイル、テスト、ツールに県専用URL・県専用マスター参照がないことを検索検査で確認した。
- `git diff --check`合格。

### 実ブラウザー確認

- 公開版の出典台帳に管轄コード34または県調達URLを持つ資料が0件。
- 公開版の全国標準マスターに県専用出典リンクが0件。
- 「全国標準参考歩掛」「原表ページ未対応」の表示を確認した。
- ブラウザー警告・エラー0件。

### 主要ファイルのSHA-256

| ファイル | SHA-256 |
|---|---|
| `app.js` | `988100ECBD9EE4E2D89FF1AA3828559653A09E2720DF98C805A837167A182A2C` |
| `consulting.js` | `0BE5BFCB2018F5176887F019081567EE8162CF680994C2EE9E61C01B214D1A20` |
| `index.html` | `6A06FCA00F0B879CA9C9EA77BF45555AFD1A04889F8A68E0B1BDAED39985B469` |
| `official-source-catalog.json` | `77391507F81B03A2C88C93D0B24CBB032C89228520128395D0E27286510C8DD1` |
| `master-standard-r8.json` | `D329A3698F8AADE986E0FA73D9A70215A67E9668E6DCFD36EBEAF0482B557897` |
| `test-nationwide-standard.js` | `3DCF394B30C164000A94E55AE929A30AF1722223B9ADBB9E1CE0E5D6AA71EC04` |

## B-2026-08-24-02

- 状態: **検証済み・GitHub Pages公開済み**
- 検証日: 2026-08-24
- 実装コミット: `085e0a70b16c6c9fa71e2fb6f04193dca904cf43`
- GitHub Pagesビルド: `1170042826`（`built`）
- 公開URL: `https://iku190t.github.io/tokushima-survey-sekisan/`
- 内容: 測量以外を人工入力中心から、基準書分類・業務条件・数量を先に選ぶ方式へ組み直し、未実装条件を完成積算と誤表示しないよう完全性区分を追加した版。

### 確認済みの実装

- `1km当り`、`10箇所当り`、`10,000m2当り`、`1孔当り1回当り`等を数量欄へ分解し、数量比を職種別人工へ反映する。
- 個数単位は整数、延長・面積は小数第3位までで、数量欄は空欄開始とする。
- 全国標準候補735表を、基準数量の一次試算703表と参照専用32表へ監査分類した。
- 編成人員、規格区分、日当たり作業量等の参照専用表は、関連計算規則なしに自動追加できない。
- 一次試算行は明細・帳票・提出前検査で補正等未反映と表示し、原表確認済み項目と区別する。
- 人工直接入力は、基準書にない作業・見積項目の折りたたみ手動調整へ移した。

### 合格した試験

- `tests/test-*.js` 全13本合格。
- `node --check consulting-engine.js`、`node --check consulting.js`合格。
- `git diff --check`合格。
- T-CONSULT-WALKSで設計549、調査・計画89、地質解析54、地質一般43の全735表を走査し、一次試算703、参照専用32を固定値確認した。

### 実ブラウザー確認

- ローカル版で令和8年度道路詳細設計（A）2.5kmを入力し、標準1kmに対する2.5倍の計算根拠と6職種の読取専用人工を確認した。
- 地質一般の地下水位測定で3孔×4回＝12倍を確認し、条件確認前は追加されないことを確認した。
- 「編成人員」を検索すると「参照専用・自動計算不可」と表示し、数量・確認・追加を無効化することを確認した。
- 原表確認済みの設計留意書は「原表確認済み」と表示し、通常の条件・数量入力が有効であることを確認した。
- 公開版で同じ一次試算表示と参照専用の追加禁止を確認し、ブラウザーエラー0件だった。

### 主要ファイルのSHA-256

| ファイル | SHA-256 |
|---|---|
| `index.html` | `615B1259132D06299791BB7EE30649EB925E7B199463BD06346B5EC8C40E0F37` |
| `consulting.js` | `620F18587839AB07C9139A12CAE68A1AE0974730FA5E06DA1E3447907580AA7C` |
| `consulting-engine.js` | `61B0D8B2F467F40E2AE7BBF6F1B263849C3F2D4D9F980440D9BE6AF477B83CDF` |
| `styles.css` | `39DF0BEAF010484C0E5DF3B3196D54E8856538E09AB7173E510C3336A8D04A78` |
| `tests/test-consulting-engine.js` | `06DA0A06D8822FFA75892F11A0EA474EE50E7EF94A0565860DB2D71CCCCAAE3C` |
| `tests/test-consulting-ui.js` | `347598E2045943BA866B69D14552816435AB5F5783A822A34CCB3A7ECC540893` |
| `tests/test-consulting-walks.js` | `9F7C240C0516697196C2872DC04765D7D05AB5C2CE8F0AFEC468557C3185AAD5` |
| `tests/test-ui-static.js` | `1EEA8B310784E0D5C52207880C1109C4FA1AC4E147503CFD91A1A616FF2A4646` |

## B-2026-08-24-03

- 状態: **検証済み・GitHub Pages公開済み**
- 検証日: 2026-08-24
- 実装コミット: `7157e17d54b2b9d7624496cecbd7e4e8c5e830b4`
- GitHub Pagesビルド: `1170548604`（`built`）
- 公開URL: `https://iku190t.github.io/tokushima-survey-sekisan/`
- 内容: 国交省の現行系列を平成23年度版＋令和8年度までの累積改定としてページ監査し、未構造化表の自動計算を止め、道路設計3規則群を出典付き条件入力へした版。

### 確認済みの実装

- 現行系列124文書・2,102ページを索引化し、旧平成14年度版を現行系列から除外した。
- 標準歩掛989、補正586、適用範囲706、式385、数量306、市場単価・規格69、編成人員63、端数273ページを別分類した（重複分類あり）。
- 道路概略設計、道路予備・予備修正設計、道路詳細設計の3補正規則群を、適用年度、条件、率、加減算方法、出典ページ付きで構造化した。
- 道路詳細設計Aは、丘陵地+10%、1～2車線-5%、複断面+20%、規定内付帯設計なし-10%を加減算し、補正+15%・係数1.15になる。
- 条件規則未実装703表と参照専用32表は自動追加不可とし、数量比例だけの金額を作らない。

### 合格した試験

- `tests/test-*.js` 全14本合格。
- `node --check consulting-engine.js`、`node --check consulting.js`、`node --check data/consulting-condition-rules.js`合格。
- `git diff --check`合格。

### 実ブラウザー確認

- ローカル版で未実装の打合せ表が「条件規則未実装・自動計算不可」となり、追加ボタンが無効であることを確認した。
- ローカル版で道路詳細設計Aの全11条件、必須条件なしの追加禁止、補正+15%・係数1.15、6職種展開、出典p.19・20および改定p.4を確認した。
- 公開版で道路詳細設計Aの条件欄、出典ページ、補正追加ボタンを確認し、ブラウザーエラー0件だった。

### 主要ファイルのSHA-256

| ファイル | SHA-256 |
|---|---|
| `consulting-engine.js` | `2AFD2AB0BC2FCCD2B689EE764EC5262428BE0B5DAE7A68D0D3129C280BA3B979` |
| `consulting.js` | `CFC71CB75AC1FCE9355EC4E6A9CB45FF87ADCAE5703A394F26895E07989DC690` |
| `data/consulting-condition-rules.js` | `847957C745AA420C814F5508AF26B852682D7C449A5BD7FF4F96738C6E3597FC` |
| `data/source-audits/mlit-effective-rule-pages.json` | `E240F1B97D7DDBB6F260579EDE00C219BD80F885C88EE202BC754291469AF100` |
| `tests/test-consulting-condition-rules.js` | `1FECF683A32864E2AADFA2397E9516D433293312136092A4E0340DEB47FED5C8` |
| `tools/build-mlit-effective-rule-inventory.py` | `02D71E5722718811031DA8898655A41A93A601DB2091656B20AA78517FE52141` |

## B-2026-08-24-04

- 状態: **検証済み・GitHub Pages公開済み**
- 検証日: 2026-08-24
- 実装コミット: `592ceb91aa15ff89cc3527558cb8fb5f16eb776a`
- 外部知能コミット: `7f16c6d43b4efede536236b2e565fc3d5cfc2cef`
- GitHub Pagesビルド: `1170683023`（`built`）
- 公開URL: `https://iku190t.github.io/tokushima-survey-sekisan/`
- 内容: 県版由来の旧735候補を現行入力から外し、R6～R8の年度統合表を国交省本体・累積改定へ逆照合した1,393歩掛行、条件表、補正式、行別経費体系、地質市場単価方式へ置換した版。

### 合格した試験

- `tests/test-*.js` 全15本合格。
- `node --check consulting-engine.js`、`consulting.js`、`data/consulting-condition-rules.js`、`data/consulting-rule-pack.js`合格。
- `git diff --check`合格。
- T-CONSULT-RULE-PACKで年度別461・462・470行、国交省URL・ページ、照合高・中のみ、職種・標準単位・経費体系を全件走査した。

### 実ブラウザー確認

- 道路詳細設計Aの2kmは`0.5×2+0.5=1.5倍`、丘陵地+10%で1.65倍となり、理事・技師長0.33人日・27,324円を含む6職種を展開した。
- 水位流量曲線の測量技師1.6人日は直接費84,320円、R8測量諸経費95.8%で80,778円、測量方式業務価格165,098円となった。
- 地質せん孔は数量20m・市場単価15,000円/mで対象額300,000円、地質諸経費82.5%で247,500円、業務価格547,500円となった。
- 橋長補正式`y=2.541×L+87.30%`はL=10で1.1271倍を自動算定した。規格表は補正選択にならず、ブラウザー警告・エラー0件だった。

### 主要ファイルのSHA-256

| ファイル | SHA-256 |
|---|---|
| `consulting-engine.js` | `2DD429C0095A59240049C4EEC0D8505DFFC3E386227287137FBC977D8DA93958` |
| `consulting.js` | `2F0AC5DB964B7EEA05106FD872FC2FABDD2B799F1AD445184964E5A4920B364E` |
| `data/consulting-rule-pack.json` | `2A23F3923181E2C4C9FA572E8E2ED54A5DD10B6CD9F0123D8BF07F031304279B` |
| `data/source-audits/consulting-fullbook-crosswalk.json` | `82B1C65BB970D4A6DAD00D13665246FAEA6F2782C0F2B455DE9B1291392B6AFE` |
| `index.html` | `B8C2F4B38FAB84D2384F6C0AD0AA47EAAFADC3F19A72235CB1B0E0D17CDF0D1F` |
| `tests/test-consulting-rule-pack.js` | `4022A6F0CDB5246B5761E664DC0D02429077F3D7FC1567F716DEB12FF55DFCD3` |

## B-2026-08-24-05

- 状態: **検証済み・GitHub Pages公開済み**
- 検証日: 2026-08-24
- 実装コミット: `b929cc4`, `1980c8b`, `5e52ae0`, `d63db5b`, `b901a2d585c184ad9b507f21a9ddd8cb3c15eac8`
- 外部知能コミット: この項目を追加するコミット
- GitHub Pagesビルド: `1170775604`（`built`、コミット`b901a2d585c184ad9b507f21a9ddd8cb3c15eac8`）
- 公開URL: `https://iku190t.github.io/tokushima-survey-sekisan/`
- 内容: 地方整備局等・適用通知・特記仕様の案件別確認ゲート、市場単価・材料・機械・運搬・個別見積等の根拠付き積上げ、低確度・未照合63ページの個別除外台帳、全項目入力ドメイン、匿名正解案件の費目別照合、別基準体系の誤用防止、公開版からの実PDF QAを追加した版。

### 合格した試験

- `tests/test-*.js` 全18本合格。
- T-CROSSWALK-63で63ページを全件走査し、表なし48、表あり15、計算対象0を確認した。
- T-CONSULT-RULE-PACKとT-ENGINEで測量R6～R8各134項目および設計等1,393歩掛の全件に入力ドメインがあり、点・箇所・回・式等は整数、m・km・m²・km²・ha・m³・t・時間は小数第3位までであることを確認した。
- T-REFERENCE-CASEで匿名化不足を拒否し、許可費目を1円単位で比較できることを確認した。実案件の正解JSONは未提供のため、案件一致は未検証である。
- `git diff --check`合格。

### 公開版・実PDF確認

- 公開HTTPS版で適用基準体系、地方整備局等、適用通知、特記仕様、価格根拠の確認状態を入力し、`確認済み`になることを確認した。
- 市場単価の匿名項目12.5m×15,000円/mを追加し、187,500円として地質直接調査費へ積み上がることを確認した。
- 港湾、空港、農林・土地改良、下水道、水道、森林、官庁営繕は別基準体系として表示し、一般土木マスターで選択・計算できないことを確認した。
- 公開版の匿名QA入口から測量5帳票と設計・調査・地質3帳票を実PDF保存し、合計8ページの文字欠け、列切れ、改ページ、表頭、合計、根拠、免責、フッターを目視確認した。
- 測量PDFは税込7,616,400円、2級基準点1単位344,800円、精度管理費290,555円、設計等PDFは税込846,418円、積上げ市場単価187,500円を画面表示・帳票で確認した。

### 主要ファイルのSHA-256

| ファイル | SHA-256 |
|---|---|
| `index.html` | `BBC00AA48C055EAE51158EDF4AF53DB798C856D0CBEEB20C7CA9F757AA431378` |
| `styles.css` | `18AA1A6939BA750C6F447D969C645A75A3088ACC4A638D16CB19A8856342F199` |
| `consulting-engine.js` | `94D7D68EA106114AC18A932C003C8DD48844F2EAE2FFF8A9DD2DD6200101900B` |
| `consulting.js` | `9A4601DECD8A19017E3972EC41BA23FE65E4922094C3C5859B1B351FB72B85EC` |
| `reference-case-engine.js` | `B7DA20ED4582AA4819EC30B544474927724DB75BE4B2ED303EA5FD2FBEA2E349` |
| `data/estimation-compliance-catalog.js` | `BB303BD3655F0B83ADB352C41F6E659B7F25A315441B4B92ED565BFA5FE507C2` |
| `data/source-audits/input-domain-audit.json` | `3C60B7CAA23081420D9139A2CCE7D05B13CE83106257710230C17969407CEF06` |
| `data/source-audits/consulting-crosswalk-resolution.json` | `5809950B7F891FEEEAA82CA14A49E53F13572A38394399C49D474388A2568324` |

## B-2026-08-24-06

- 状態: **検証済み・GitHub Pages公開済み**
- 検証日: 2026-08-24
- 実装コミット: `9b85641a24a76d59de5f757f0399186e17ea91df`
- 外部知能コミット: この項目を追加するコミット
- GitHub Pagesビルド: `1170995707`（`built`）
- 公開URL: `https://iku190t.github.io/tokushima-survey-sekisan/`
- 内容: 設計・調査計画・地質の適用通知・特記仕様確認UIと帳票表を撤去し、設計・測量・調査計画・地質の上部情報、状態帯、作業追加、積算内訳、追加費用、右集計の画面骨格と命名を統一した版。

### 合格した試験・実画面確認

- `tests/test-*.js` 全18本合格、`node --check consulting.js`合格、`git diff --check`合格。
- ローカル版と公開版で4業務を順に切り替え、上部5項目と`WORK ITEM`、`ESTIMATE DETAIL`、`ADDITIONAL COSTS`、`COST SUMMARY`が全業務で一致することを確認した。
- 公開版で適用通知・特記仕様確認欄0件、ページ横あふれ0、ブラウザー警告・エラー0件を確認した。
- 匿名QA帳票DOMは3ページで、総合積算総括表、業務費内訳書、積上費用台帳を生成し、適用基準・適用通知・特記仕様の確認表を含まないことを確認した。

### 主要ファイルのSHA-256

| ファイル | SHA-256 |
|---|---|
| `index.html` | `2710DB8387961E9B30419B5C769EC037678671DB0203B237CC31C6CF0FEE0414` |
| `styles.css` | `BE06A37AC5FF2ECD4B45E534129FA19AA35723E50D3F71991E9B1750D5E9D508` |
| `app.js` | `74648BD6EE671D45A5ACEDD3EF639A5919DE539BA14563C2DA6D52F9141F9DEC` |
| `consulting.js` | `D393E297A03C4D2BEAA393B7A70EDEFB2EFCF4F9A863C184FCD5C28BF8A4CA47` |
| `tests/test-consulting-ui.js` | `9C0B3859F63C105C94785D9EEA186F7D1112AA0024C045EE22594DC61BEA23BF` |
| `tests/test-ui-static.js` | `A12A6144681A74619B6112AD23FBBC9E04D5D30C18FE94EF03B2CF5012001DAF` |

## B-2026-08-24-07

- 状態: **検証済み・GitHub Pages公開済み**
- 検証日: 2026-08-24
- 実装コミット: `6a6ec81dbdca4d9bb4a7e732d86dc199e1c73dd9`
- 公開キャッシュ修正コミット: `a945774ca36f6b83705180282eb98201ecaec9e3`
- 外部知能コミット: この項目を追加するコミット
- GitHub Pagesビルド: `1171009494`（`built`、コミット`a945774ca36f6b83705180282eb98201ecaec9e3`）
- 公開URL: `https://iku190t.github.io/tokushima-survey-sekisan/`
- 内容: 測量画面の「国土交通省・全国標準｜年度」状態帯、説明本文、DOM更新処理、不要になったARIA参照を撤去した。提出先・標準単価セット・年度切替・計算根拠は維持する。

### 合格した試験・実画面確認

- `tests/test-*.js`全18本合格、`node --check app.js`合格、`git diff --check`合格。
- ローカル版で測量状態帯0件、令和7年度切替後134項目、設計・調査計画・地質の説明帯各1件、4業務の横あふれ0、ブラウザー警告・エラー0件を確認した。
- 公開版で`app.js?v=20260824-4`を読み込み、測量状態帯0件、年度3件、令和8年度測量141項目、横あふれ0、ブラウザー警告・エラー0件を確認した。

### 主要ファイルのSHA-256

| ファイル | SHA-256 |
|---|---|
| `index.html` | `9F288B3B870ECCB7808A0A6B950570B0A285185A78F0C67EE694D1003F42FABF` |
| `app.js` | `EB38F5625D2B16021FC329CA2B5A85CF0C34E181B88524B1BA8223FFDC3908DB` |
| `tests/test-ui-static.js` | `A5D4A83298E4C1DBA07E448D7A7FF2105DB102C1B4810E8C20B51D8E3557523A` |

## B-2026-08-24-08

- 状態: **検証済み・GitHub Pages公開済み**
- 検証日: 2026-08-24
- 実装コミット: `897614da64abaece6f59be2c6833508217194f13`
- 外部知能コミット: この項目を追加するコミット
- GitHub Pagesビルド: `1171018802`（`built`、コミット`897614da64abaece6f59be2c6833508217194f13`）
- 公開URL: `https://iku190t.github.io/tokushima-survey-sekisan/`
- 内容: 4業務の上部5項目、業務基本情報7項目、4カードを統一し、見積提出先と基本情報をタブ間同期した。業務別状態帯は全廃した。

### 合格した試験・実画面確認

- `tests/test-*.js`全18本合格、`node --check app.js`、`node --check consulting.js`、`git diff --check`合格。
- ローカル版で設計側から北海道と匿名発注者を入力し、測量側へ同じ値が即時反映されることを確認した。
- 公開版4タブすべてで上部5項目、基本情報7項目、作業追加・積算内訳・追加費用・右集計各1組、状態帯0件、横あふれ0を確認した。`app.js?v=20260824-5`と`consulting.js?v=20260824-10`を読み込み、ブラウザー警告・エラー0件だった。

### 主要ファイルのSHA-256

| ファイル | SHA-256 |
|---|---|
| `index.html` | `AA30B0DB4C90EA939A6589DDE3A809B5C38985066CEBFC051ECBBE16AD1F151E` |
| `app.js` | `3E93BFD52D8C2A3229E758E1C57DF575AA5FB4129C4744B73CCBB1BD764362E1` |
| `consulting.js` | `F5E716B144C1A376C215ABC99E02D4E6268C6405AE03382AC6AFC289C84FA18B` |
| `tests/test-ui-static.js` | `24192DB8FD6CF1BC5AE779A811044DD0839139B49B7191342E8798755A7C8B0D` |

## B-2026-08-24-09

- 状態: **検証済み・GitHub Pages公開済み**
- 検証日: 2026-08-24
- 実装コミット: `1687111ad670b8fa03101fafa764e66f5817aad7`
- 外部知能コミット: この項目を追加するコミット
- GitHub Pagesビルド: `1171080579`（`built`、コミット`1687111ad670b8fa03101fafa764e66f5817aad7`）
- 公開URL: `https://iku190t.github.io/tokushima-survey-sekisan/`
- 内容: 4業務の作業選択を、年度マスターに連動する常時表示キーワードへ統一し、名称検索を補助操作へ移した。正式な基準分類・業務条件・数量・出典は選択後に維持する。

### 合格した試験・実画面確認

- `tests/test-*.js`全18本合格、`node --check app.js`、`node --check consulting.js`、`git diff --check`合格。
- 令和6～8年度で、各業務の表示キーワードに属する候補件数の合計が年度候補総数と一致した。令和8年度は設計313、測量141、調査・計画117、地質40件である。
- 公開版4タブでキーワード一覧、選択中表示、補助検索の初期閉鎖、横あふれ0を確認した。測量「基準点」は14項目、設計「橋梁」は70歩掛、地質「解析」は7歩掛へ絞られた。

### 主要ファイルのSHA-256

| ファイル | SHA-256 |
|---|---|
| `index.html` | `85A025C62677AD18A79C707F1DEADF1345A57AC24D298696E0A7626D61C7C4D7` |
| `styles.css` | `BF2BA7124A112EECBB1A10D20BE113891B3EB377A8C8D28281AB76F2C76CAF54` |
| `app.js` | `B6739940BB6ED75D0CCBE2424DB0293786389CE975F2CFE79BDD9EFE65A62F5D` |
| `consulting.js` | `881E19AFA79E9077C1D080658ECFD872503B2FEE0391ED08CEA9F4BAB855444C` |
| `tests/test-ui-static.js` | `C5197766C9667500E744382CE947FAE7CDFF3AB34C6926990D12DD86332D309D` |
| `tests/test-consulting-ui.js` | `FDF19BB248F7C4DEB869EB40E2243C790F6F49A0537DA40D937334913CD99055` |

## B-2026-08-24-10

- 状態: **検証済み・GitHub Pages公開済み**
- 検証日: 2026-08-24
- 実装コミット: `aa2be68eacc51fe3f097789a296011c9245c2a48`
- 外部知能コミット: この項目を追加するコミット
- GitHub Pagesビルド: `1171120305`（`built`、コミット`aa2be68eacc51fe3f097789a296011c9245c2a48`）
- 公開URL: `https://iku190t.github.io/tokushima-survey-sekisan/`
- 内容: 4業務の通常入力を「積算基準の作業区分・作業項目・積算数量（単位）・追加」へ統一し、選択項目または地質市場単価の選択単位を数量見出しへ表示する。

### 合格した試験・実画面確認

- `tests/test-*.js`全18本合格、`node --check app.js`、`node --check consulting.js`、`git diff --check`合格。
- ローカル版で測量の「積算数量（回）」が水準測量選択後に「積算数量（km）」へ変わり、入力制限も整数から小数第3位へ切り替わることを確認した。
- 設計「積算数量（式）」、調査計画「積算数量（業務）」、地質市場単価の単位未選択・m選択後の「積算数量（m）」、PC横並び・狭幅縦並びを確認した。
- 公開版4タブで共通ラベル、作業項目連動単位、追加ボタン、ページ全体の横あふれ0、ブラウザー警告・エラー0件を確認した。

### 主要ファイルのSHA-256

| ファイル | SHA-256 |
|---|---|
| `index.html` | `5016083AC85A31A6574853B24CEDB66F0103BB57E5A3BA533CD3A5AC6F3DDA2A` |
| `styles.css` | `E98418306FA627FE1E2FFEC118E5DF1E75B1F61099301CF371B67DEB043F0BE0` |
| `app.js` | `FF46B9C6FE15E66C54CF360ED62EE65409F7CDA10964B8BB6EBD6FA864419F8C` |
| `consulting.js` | `5A1B2030DDF0C50783E0637C3276764B15286314582ABFC3EE9DCD873320EF5B` |
| `tests/test-ui-static.js` | `9B0DCB78293AD3FCCEBC986C6971C7333192A3A5B0EFAF2CA379219ABDE69015` |
| `tests/test-consulting-ui.js` | `4C78A330664DEE4E8C88F9CB39E8CDDAF6214CA391CF41718D9EF40EF0660044` |

## B-2026-08-24-11

- 状態: **検証済み・GitHub Pages公開済み**
- 検証日: 2026-08-24
- 実装コミット: `81be9cb92bd3704ee35dc6802f5240bf8aff08d5`
- 外部知能コミット: この項目を追加するコミット
- GitHub Pagesビルド: `1171148519`（`built`、コミット`81be9cb92bd3704ee35dc6802f5240bf8aff08d5`）
- 公開URL: `https://iku190t.github.io/tokushima-survey-sekisan/`
- 内容: 設計・調査計画・地質の数量欄直下の補助文を撤去し、数量入力欄と追加ボタンの枠を揃えた。整数・小数桁の制約と説明は入力属性、検証処理、`aria-description`へ保持した。

### 合格した試験・実画面確認

- `tests/test-*.js`全18本合格、`node --check consulting.js`、`git diff --check`合格。
- ローカル版の設計・調査計画・地質で数量欄内の`small`要素0件を確認し、設計・調査計画で数量入力欄と追加ボタンの上端・下端差が0pxだった。
- 公開版で`consulting.js?v=20260824-13`を読み込み、数量欄の補助文0件、数量入力欄と追加ボタンの上端・下端差0px、ブラウザー警告・エラー0件を確認した。

### 主要ファイルのSHA-256

| ファイル | SHA-256 |
|---|---|
| `index.html` | `5FD6EE91A8E85C7F0601CB39175A503C17B8E2D884DD396080545C50414B53C3` |
| `consulting.js` | `325A9146B1268BCCFE007F61D491F654540F44CFF362D44985206BE89707FF95` |
| `tests/test-consulting-ui.js` | `A8A2ABFBE06204EFE3CB08BAB9259A6FF58B8EB33FB4FD5E37C3EF94415A8C11` |

## B-2026-08-24-12

- 状態: **検証済み・GitHub Pages公開済み**
- 検証日: 2026-08-24
- 実装コミット: `2692aeaf6eb94ad3d02503f4241ff266a76c565a`
- 外部知能コミット: この項目を追加するコミット
- GitHub Pagesビルド: `1171205263`（`built`、コミット`2692aeaf6eb94ad3d02503f4241ff266a76c565a`）
- 公開URL: `https://iku190t.github.io/tokushima-survey-sekisan/`
- 内容: PDF取込の未選択状態で項目・数量・単位を空欄へ戻し、39.21秒の紹介MP4、サムネイル、再生プレーヤー、保存ボタンを使い方画面へ追加した。

### 合格した試験・実画面確認

- `tests/test-*.js`全18本合格、`git diff --check`合格。
- 紹介MP4を全941フレームまでデコードし、H.264 High、yuv420p、1280×720、24fps、39.21秒、破損なしを確認した。8場面の一覧画像とサムネイルを目視確認した。
- ローカル／公開版で動画の`readyState=4`、再生時間39.21秒、操作ボタンあり、自動再生なし、警告・エラー0件を確認した。スマートフォン390px幅は1列表示、横あふれ0pxだった。
- 公開版のPDF取込画面で、未選択時の項目・数量・単位がすべて空文字になることを確認した。

### 主要ファイルのSHA-256

| ファイル | SHA-256 |
|---|---|
| `index.html` | `82E353866EE7BAD5239B3F478D633646DEFA12FCA73A7B0D33DAF93404A96191` |
| `styles.css` | `11624BE8F8D91AB6CACB738D28F518AA043F501387EB6871F4FB119562F936C6` |
| `document-import.js` | `F1FCAC30246D75DA3B2B911D2795135A66DC27BE78B7DE060F5C63DEECE6A873` |
| `tests/test-ui-static.js` | `366F8C0C7239FF3F184A6D079CBE0460CB99BA20D01206EF078BC8D63541C63F` |
| `tests/test-document-import-ui.js` | `4374879968F1D605C354FD117B63CB313BE38823D64BCBC8F5F53EFFE6854B77` |
| `media/web-sekisan-introduction.mp4` | `D438C548C1B01ED9955D8229E19711A722185F01BC03CA939B5E777E46186327` |
| `media/web-sekisan-introduction-thumbnail.jpg` | `16B102CC94C8E9EBB0FF965AD5B1E7AD6735545D05687D3D0A354300C7BAD54D` |
| `tools/create-intro-video.py` | `CD3FB4267069E5AE93D24C940945F897765F001DC4103193491ACD3312B6134D` |

## B-2026-08-24-13

- 状態: **検証済み・GitHub Pages公開済み**
- 検証日: 2026-08-24
- 実装コミット: `42966c68c9810a999e45db013ea39329bf376ec8`
- 外部知能コミット: この項目を追加するコミット
- GitHub Pagesビルド: `1171261067`（`built`、コミット`42966c68c9810a999e45db013ea39329bf376ec8`）
- 公開URL: `https://iku190t.github.io/tokushima-survey-sekisan/`
- 内容: 紹介動画を実PDFドラッグ4場面、日本語ナレーション、オリジナルBGM付きへ更新し、高確度なPDF先頭業務見出しの4業務共通欄への自動入力と、複数候補通知の操作枠明示を追加した。

### 合格した試験・実画面確認

- `tests/test-*.js`全18本合格、`git diff --check`合格。
- 匿名合成A4 PDFをPNG化し、文字欠け、表ずれ、列切れなしを目視確認した。
- ローカル実ブラウザーで匿名PDFを読み込み、2級基準点測量、数量20、単位「点」を緑枠へ個別ドラッグし、反映待ち1件へ追加した。4業務タブの業務名はすべて同じ自動入力値だった。
- 紹介MP4を全1,194フレームまで復号し、H.264 High、yuv420p、1280×720、24fps、49.75秒、AAC音声、平均音量-17.6dB、最大-0.8dB、破損なしを確認した。PDF実演4場面とサムネイルを目視確認した。
- 公開版で動画`readyState=4`、49.75秒、`muted=false`、警告・エラー0件を確認した。Google Analyticsタグ`G-88B9YPJXWP`のHTTPS読込も確認したが、GA管理画面への着信は未検証である。

### 主要ファイルのSHA-256

| ファイル | SHA-256 |
|---|---|
| `index.html` | `18D50FB4B51802C7510A8A35E167EB61202B5A4C36D60FDFA75D3671ED7719D7` |
| `document-import-engine.js` | `8B80D1A88F8EA9EBE385DEC6A99229F57DA5CFFF376C35EB2A8B829F8E743895` |
| `document-import.js` | `CA41350D2BB36D8175603AFE07A755DB0BFC8326101FDEC454518CBF3080E6C9` |
| `tests/test-document-import.js` | `1EDA38DA9563A10CCFC4CF8B7C45209D94936CFDA35921D741EF181A71A52139` |
| `tests/test-document-import-ui.js` | `46A925992A8E39BEB7613DEC927FB930D8E579938AB2D9204F242AC0CBF96B09` |
| `tests/test-ui-static.js` | `910E232C539343690DA8C06500296366E9B00616B6A523C5D3F8D1EF49770670` |
| `media/web-sekisan-introduction.mp4` | `01132E54A0C141665973B8CF0F84EE4F2357FC9A89810557EDD89CB92B598B6B` |
| `media/web-sekisan-introduction-thumbnail.jpg` | `06C8956C886E5297ADC44DAC4C011F61C12335AAADFFA7F24DA6F2CE971DB9F0` |
| `media/intro-assets/web-sekisan-demo.pdf` | `816D078DDD3BA40D01CDB4EEC9AA85EB5794F45FCB0A894E8BBB30A6C5523074` |
| `tools/create-intro-video.py` | `CD1EF93E64847F2E0559D9E08FE9716913C6B463D52B7C71453DA6344B7C1C78` |
| `tools/create-intro-demo-pdf.py` | `75A9347449DB9E8FEA781F27A0A887DE4FA60CEB06E477FE6592F64E5A11358D` |
| `tools/create-intro-narration.ps1` | `796AB335109334E17B3E9123BC6517BD3152393FA640804055313373D341F486` |

## B-2026-08-24-14

- 状態: **検証済み・GitHub Pages公開済み**
- 検証日: 2026-08-24
- 実装コミット: `8bc0eca999d841d419032764e9ff7916713d8d79`
- 外部知能コミット: この項目を追加するコミット
- GitHub Pagesビルド: `1171311721`（`built`、コミット`8bc0eca999d841d419032764e9ff7916713d8d79`）
- 公開URL: `https://iku190t.github.io/tokushima-survey-sekisan/`
- 内容: 提出用帳票の自社・発行者7項目を案件外プロフィールとして自動保存し、新規作成へ引き継ぐ。案件固有情報、匿名QA帳票、外部送信から分離し、旧案件から初回移行する。

### 合格した試験・実画面確認

- `tests/test-*.js`全18本合格、`node --check app.js`、`git diff --check`合格。
- ローカル実ブラウザーで匿名の会社名、担当者、郵便番号、住所、インボイス番号を入力し、「新規」後と再読込後に同値を確認した。宛名と業務名は空欄だった。ブラウザー警告・エラーは0件。
- 公開版で`app.js?v=20260824-8`、自社・発行者情報の7入力欄、自動保存案内を確認し、ブラウザー警告・エラー0件だった。

### 主要ファイルのSHA-256

| ファイル | SHA-256 |
|---|---|
| `index.html` | `CCA559DCDBD98E57E3766FF03098686CBA4064AB295C701A3D4B12350BA14A43` |
| `app.js` | `22D475C4041274CC8427C149F16ED560A17E27B0A160872CCA50630F3B17E7AF` |
| `tests/test-ui-static.js` | `BD83634012B39E29386F42072E4B8846E502C3D112F3C4B56A62C11B9085233E` |
| `README.txt` | `7E2DEF0305E1629D9529D87020B0E56E631167945FB099E82D0CE2F537BF6878` |

## B-2026-08-24-15

- 状態: **検証済み・GitHub Pages公開済み**
- 検証日: 2026-08-24
- 実装コミット: `c68e67738386d18c97cbb21e56fed3254412f34d`
- 外部知能コミット: この項目を追加するコミット
- GitHub Pagesビルド: `1171344364`（`built`、コミット`c68e67738386d18c97cbb21e56fed3254412f34d`）
- 公開URL: `https://iku190t.github.io/tokushima-survey-sekisan/`
- 内容: PDF取込の原文と反映先を分離し、4業務の反映先を通常入力と同じキーワード、積算基準の作業区分、年度別公式作業項目へ統一した。設計等は公式規則IDを保持し、匿名デモPDFの再実行可能な実ブラウザーQA入口を追加した。

### 合格した試験・実画面確認

- `tests/test-*.js`全18本、`node --check app.js consulting.js document-import.js`、`git diff --check`合格。
- ローカル実ブラウザーで匿名デモPDF1ページ・20文字ブロックを抽出し、設計313、測量141、調査・計画117、地質40項目を確認した。設計38作業区分、公式「1-1 打合せ等 打合せ 業務着手時｜1式当り」を主任技術者1人日で反映待ちへ追加した。
- 公開版で`document-import.js?v=20260824-13`、4業務順、原文「業務数量総括表」の不変、同じ4業務件数、設計キーワード件数、設計38作業区分、公式「業務着手時」を確認した。ブラウザー警告・エラー0件。

### 主要ファイルのSHA-256

| ファイル | SHA-256 |
|---|---|
| `index.html` | `5C718014CAE7FD855E036CEA06EEFA5F51B8CDEEF8D11B0D4D8C6D4F8BC2B423` |
| `styles.css` | `FA7872A7C428A937DBF625FAAD354F883AC91D83BBC4623C83177510B8CE6888` |
| `app.js` | `19B0AB879774B6807A4D3965FAB3895D76B0AEA8A98E3CBB71D0850ED4738579` |
| `consulting.js` | `E71FB3A2E650948A6B5B30E512F703EA44FE54D25A4D60295E0ACFC986209676` |
| `document-import.js` | `AB7FE2DE06881A7945A8C7D1D969A83FE4CE353630BE681C648756F843357B36` |
| `data/consulting-work-catalog.js` | `D9E501B596B9A63AA1C9CC9BFB2FAB5966903877E4E3CA49E00489F3FC2F5D75` |
| `tests/test-document-import-ui.js` | `7BDD1A4E21E39D1AEFFCDA58BCC60B8D3967597E675C9D4774971997B57878DA` |
| `tests/test-consulting-ui.js` | `E6E3BC13E8DF467A8CACB34BA3543A10FC4D914C93E3B4EE94B4E4257D9ED4FB` |
| `tests/test-ui-static.js` | `56A085542BCA0BED724E72485D4B4B49921C9719A9F007B24DE06AB4183A5630` |

## B-2026-08-24-16

- 状態: **検証済み・GitHub Pages公開済み**
- 検証日: 2026-08-24
- 実装コミット: `0811d14e7316218e39197d293a320db9ecd88613`
- 外部知能コミット: この項目を追加するコミット
- GitHub Pages: `built`、コミット`0811d14e7316218e39197d293a320db9ecd88613`、GitHub Actions実行`32703890354`
- 公開URL: `https://iku190t.github.io/tokushima-survey-sekisan/`
- 内容: PDF行クリックと反映先の業務区分切替で番号1・2・3を推定入力せず、測量の項目・数量・単位と、設計等の作業項目・職種・人工を明示選択またはドロップまで空欄に保つ。

### 合格した試験・実画面確認

- `tests/test-*.js`全18本、`node --check document-import.js`、`git diff --check`合格。
- ローカル版で匿名デモPDF1ページ・20文字ブロックを読み込み、待機時、未判定行クリック後、設計・測量・調査計画・地質切替後の全6入力値が空文字であることを確認した。明示的に測量項目・数量・単位を入力した時だけ値を保持し、設計でも作業項目選択だけでは職種・人工が空欄のままであることを確認した。
- 公開版で`document-import.js?v=20260824-14`、未判定行クリック後と4業務切替後の同じ空欄状態を確認した。

### 主要ファイルのSHA-256

| ファイル | SHA-256 |
|---|---|
| `index.html` | `4A30929CBF0D9F57E7D367DE499D7039579D0A1BE59A7D74BAFACFB814AD061C` |
| `document-import.js` | `A95BF29AFB03F3324F3EAF2A3837766FBE91FC71DAD5D62B9B952927EAF2222E` |
| `tests/test-document-import-ui.js` | `7C154AA3F2071D272576C301A250A3BE4FEDB4187F4C4968C140BCE7D078BF9C` |

## B-2026-08-24-17

- 状態: **検証済み・GitHub Pages公開済み**
- 検証日: 2026-08-24
- 実装コミット: `5ccf9464feabe1a2b2c59469302e0b75dcc05875`
- 外部知能コミット: この項目を追加するコミット
- GitHub Pages: `built`、コミット`5ccf9464feabe1a2b2c59469302e0b75dcc05875`、GitHub Actions実行`32704526628`
- 公開URL: `https://iku190t.github.io/tokushima-survey-sekisan/`
- 内容: PDFクリック取込の右側に重複していた「PDF原文（確認用）」ラベルと引用枠を廃止し、見出し直下を反映先選択へ詰めた。左側PDF、出典情報、番号1・2・3の空欄開始と個別対応付けは維持する。

### 合格した試験・実画面確認

- `tests/test-*.js`全18本、`node --check document-import.js`、`git diff --check`合格。
- ローカル／公開版の匿名デモPDFで、`PDF原文（確認用）`0件、`#pdfManualSourceText`なし、見出し直後の最初の入力が`#pdfManualKind`であることを確認した。
- 未判定PDF行をクリック後も、測量の作業項目・数量・単位がすべて空文字であることを確認した。

### 主要ファイルのSHA-256

| ファイル | SHA-256 |
|---|---|
| `index.html` | `3A6F650622C8F0C3C92E6F45562EBA9A4D4D9DC756A2AB18FF06558D414B792D` |
| `styles.css` | `0AB6367C8D3972D044F1D2906DC1C47210E81075A93500819A11A0658AEC5692` |
| `document-import.js` | `2F7610E100337B213DEE43F0774664E92D5E0C9512E7365AF5166F85EF4253D6` |
| `tests/test-document-import-ui.js` | `BB41AE642AAFF8B679C331B6934CC3F298DF79DC3EF076A85B9BD4ECCB5B7961` |

## B-2026-08-24-18

- 状態: **検証済み・GitHub Pages公開済み**
- 検証日: 2026-08-24
- 実装コミット: `550bc1d543ffbd71b9d4c9a779ee7959771446d0`
- 外部知能コミット: この項目を追加するコミット
- GitHub Pages: `built`、コミット`550bc1d543ffbd71b9d4c9a779ee7959771446d0`、GitHub Actions実行`32705409453`
- 公開URL: `https://iku190t.github.io/tokushima-survey-sekisan/`
- 内容: PDF反映待ちの補助操作4個を撤去し、「反映待ち○件を積算へ追加」1ボタンへ集約した。候補カードの同一画面編集と、追加後の各業務画面での修正は保持する。

### 合格した試験・実画面確認

- `tests/test-*.js`全18本、`node --check document-import.js`、`git diff --check`合格。
- ローカル版で補助ボタン0件、確定ボタン1件、候補0件時の無効状態、候補1件時の文言と有効状態、候補カードからの変更画面を確認した。
- ローカル／公開版で匿名デモPDFの2級基準点測量1件を選び、「反映待ち1件を積算へ追加」で測量1件へ反映し、反映待ち0件へ戻ることを確認した。

### 主要ファイルのSHA-256

| ファイル | SHA-256 |
|---|---|
| `index.html` | `C642BDEB6B8FA8ADA25F66995154C906B50DB6476586B97DDE9408C33690F7D6` |
| `document-import.js` | `A29105EFF8584BB531C5D2C66858DDD3B654A9D463148D7B192E7FEF6FC4B5B4` |
| `tests/test-document-import-ui.js` | `08BBC491F0259F1151A26D89155B36F5FA5470C2E3B9C716C32242EEFBEC3270` |

## B-2026-08-24-19

- 状態: **検証済み・GitHub Pages公開済み**
- 検証日: 2026-08-24
- 実装コミット: `4bb0b373aa461e64827013dc24bbec834f8109ec`
- 外部知能コミット: この項目を追加するコミット
- GitHub Pages: `built`、ビルド`1171507181`、コミット`4bb0b373aa461e64827013dc24bbec834f8109ec`
- 公開URL: `https://iku190t.github.io/tokushima-survey-sekisan/`
- 内容: 令和6～8年度・4業務の積算数量単位を41単位の共通台帳へ統合し、通常入力、数量式、PDF単位検出、ドラッグ＆ドロップ、桁制御を同一化した。反映待ちカードへ業務バッジと個別除外を追加し、反映後の行を一時強調、完了表示を短縮した。

### 合格した試験・実画面確認

- `tests/test-*.js`全19本、変更JS10ファイルの`node --check`、`git diff --check`合格。
- T-UNIT-CATALOGで、測量3年度402作業項目と設計・調査計画・地質3年度規則パックの台帳外単位0件、41単位の入力桁、100枚標準数量、筆の認識と異次元換算拒否を確認した。
- ローカル実ブラウザーで写真処理項目の単位候補43件、`100枚`、`枚`、`筆（固定換算なし）`、`1×100枚＝100枚`、筆から枚への換算拒否を確認した。2級基準点1件の業務バッジ、個別除外、追加後強調、短い完了表示、点9.9入力の整数10補正、警告・エラー0件を確認した。
- 公開版で`data/unit-catalog.js?v=20260824-1`、`app.js?v=20260824-10`、同じ単位候補43件、100枚、筆、測量バッジ、個別除外、確定ボタン1件、警告・エラー0件を確認した。

### 主要ファイルのSHA-256

| ファイル | SHA-256 |
|---|---|
| `index.html` | `0F680529D8E2382FDC417448A9FB541EC3313F7A4A57FD75AB191066FFA0E61B` |
| `styles.css` | `F22FF75539A64D923ED0F35194746D07B18285936EEA11EA47083284AA669EBD` |
| `app.js` | `165CA29B10603638A5774802ECEDAA710FE8033E611432FB5A694366BBC52D0F` |
| `consulting-engine.js` | `3276BAF9D1015AA82ECD1622AB3DA5D2BE8BB2ED907759F925904B5615090A7F` |
| `consulting.js` | `723D9C8D32D7A27C216F8A3D9689B4523BF41491BF2453AD1D4F98C64597C1AA` |
| `document-import-engine.js` | `CEB729DC3E51B1627347CE0FFDD67D55B261F97CFFBE16B28B2FAEF266F1C42C` |
| `document-import.js` | `7EFBA2CE088EC225246D5C8371A0144CC0BA776C8AF5B67D9BA1769CC87E7A07` |
| `engine.js` | `FFA8E17E4288074455C363E937BA6A228B32BB601462A36820C2A02639C8838C` |
| `data/unit-catalog.js` | `BB48E75A20900048C52EADD95D6697124C010A0BE2D13E08ACD36529FF63B953` |
| `tests/test-unit-catalog.js` | `236D64C0A04632DFD6D12053D320B9F32F0D6AA8A712550C361B18323253610A` |

## B-2026-08-24-20

- 状態: **検証済み・GitHub Pages公開済み**
- 検証日: 2026-08-24
- 実装コミット: `9f024e1ef759e1ec340bfcd467d9054f10bf0a47`
- 外部知能コミット: この項目を追加するコミット
- GitHub Pages: `built`、ビルド`1171568248`、コミット`9f024e1ef759e1ec340bfcd467d9054f10bf0a47`
- 公開URL: `https://iku190t.github.io/tokushima-survey-sekisan/`
- 内容: PDF取込で作業項目だけを反映待ちへ追加できる。測量の数量・単位、設計等の職種・人工は空欄を保持し、不足値がある行は入力待ちとして計算から除外する。初期値1・単位の自動補完を行わず、数字付き単位は標準数量との一致を判定して安全に分離する。

### 合格した試験・実画面確認

- `tests/test-*.js`全19本、変更JavaScript 4ファイルの`node --check`、`git diff --check`合格。
- T-DOC-UIで作業項目だけの追加ボタン有効化・強調、空欄維持、入力待ち計算除外、後入力経路を確認した。
- T-UNIT-CATALOGで`10,000m²`を標準単位として扱い数量10,000へ誤転記しないこと、`12m²`を数量12と単位へ分離することを確認した。
- ローカル実ブラウザーで測量入力待ちが税込0円、設計入力待ちが税込0円であること、設計に職種と人工1を後入力すると税込184,589円へ移ることを確認した。
- 公開版で測量の作業項目選択後も数量・単位が空欄、追加ボタンが有効、反映待ちカードが「数量未入力（計算対象外）」となること、ブラウザー警告・エラー0件を確認した。

### 主要ファイルのSHA-256

| ファイル | SHA-256 |
|---|---|
| `index.html` | `64F8C96BDA27DD686CEDF4EC456B7189A27CB24B1A3149FF1CEDC15938E76978` |
| `styles.css` | `3B5B8C3CCEC7D47F18368A62401AF7E8380BA0FA2F4808EF42F788700CA134C7` |
| `app.js` | `31193770514452C15643115BABA87C801B0A5D8EEC0B84BA3854C551773DEE4A` |
| `consulting.js` | `84964FDC287F39A3D610768D5678E5AB291B8AA7543D379817C8EE76ED710B43` |
| `document-import-engine.js` | `74BA15120BAD02BF5118B622D7F50F1C165C8C1584E575BC4C306905631D13E3` |
| `document-import.js` | `247962CE7D91E73108D92A3BA1A98B6B36817E94592A33BC680C0052142EB446` |
| `tests/test-document-import-ui.js` | `730C992D713EC61D5505F1D6F617BDB7C4B411A98B4993273B876780E1612340` |
| `tests/test-unit-catalog.js` | `BFB8CD480E8C17EE0D94722535368689D513AF1385A59351474F551FE1B5D90A` |

## B-2026-08-24-21

- 状態: **検証済み・GitHub Pages公開済み**
- 検証日: 2026-08-24
- 実装コミット: `6f8bb690cfbf7b0955d72dd160d945606fcee91c`
- 外部知能コミット: この項目を追加するコミット
- GitHub Pages: `built`、コミット`6f8bb690cfbf7b0955d72dd160d945606fcee91c`、更新確認`2026-08-24T10:23:18Z`
- 公開URL: `https://iku190t.github.io/tokushima-survey-sekisan/`
- 内容: PDFで正常にドラッグした各文字ブロックを即時に濃い緑枠・チェック表示し、項目行全体へ未入力内容または入力完了を文字表示する。測量の規定書表を画面下部の計算根拠カードへ移し、4業務の主要カード順を統一する。

### 合格した試験・実画面確認

- `tests/test-*.js`全19本、`node --check document-import.js`、`git diff --check`合格。
- ローカル匿名デモPDFで、項目ドラッグ直後に文字ブロック1個が緑枠・チェック、行全体が「項目追加済み｜数量未入力」となることを確認した。数量20の追加後は「項目追加済み｜単位未入力」、単位「点」の追加後は「入力完了」となり、文字ブロック3個の緑枠と行状態がPDF領域の往復スクロール後も残った。
- 項目だけを反映待ちへ追加した後も、反映待ち1件と「項目追加済み｜数量未入力」の行表示が残ることを確認した。
- ローカル／公開版で、設計・測量・調査計画・地質の主要カードが作業追加、積算内訳、追加費用・条件、計算根拠の4段・同順序であることを実DOM確認した。
- 公開版で`document-import.js?v=20260824-19`、`styles.css?v=20260824-14`、項目ドラッグ後の緑枠1個と「項目追加済み｜数量未入力」、ブラウザー警告・エラー0件を確認した。

### 主要ファイルのSHA-256

| ファイル | SHA-256 |
|---|---|
| `index.html` | `50C3CD1D1FA41A1674A2FD4253EDC45A4B7D87C8640689D8F7B39ADF13A2CF82` |
| `styles.css` | `ECF4F2127CC795468935E44D649D5770EEEE70CB37CF89D12E0FFCF6ED0D9C23` |
| `document-import.js` | `08375D91A8E9095A2C3A7B03147600E6535596407E0743A1F76558DDDE7D9544` |
| `tests/test-document-import-ui.js` | `BC48E6B5859A364799A92A0E85FB83276A8E4393B191A913FDDC9F3031CB4B57` |
| `tests/test-ui-static.js` | `6AB2A3AD203B2B9845974BC55BADA7E37E7BD0D99698778A7346D3F6CD36989E` |

## B-2026-08-24-22

- 状態: **検証済み・GitHub Pages公開済み**
- 検証日: 2026-08-24
- 実装コミット: `cc739952c9034bbca2aca8ac6bc167b3e53f43a4`
- 外部知能コミット: この項目を追加するコミット
- GitHub Pages: `built`、ビルド`1171664583`、コミット`cc739952c9034bbca2aca8ac6bc167b3e53f43a4`
- 公開URL: `https://iku190t.github.io/tokushima-survey-sekisan/`
- 内容: 測量の作業追加カード内部を設計等と同じキーワード→補助検索→作業選択グリッドへ統一し、測量専用説明帯を撤去した。計算根拠も3列表から設計等と同じ一覧形式へ変更し、測量固有の正式分類・数量規則・計算式・公式リンクは保持した。

### 合格した試験・実画面確認

- `tests/test-*.js`全19本、`git diff --check`合格。
- ローカル実ブラウザーで設計と測量の作業区分220px、作業項目420px、積算数量150px、追加ボタン高さ40pxが一致すること、測量説明帯0件、測量根拠表0件・根拠リスト4件、ブラウザー警告・エラー0件を確認した。
- 公開版で`styles.css?v=20260824-15`、`app.js?v=20260824-12`、測量の共通`verified-preset-row`、説明帯0件、計算根拠`UL.source-list`4件、ブラウザー警告・エラー0件を確認した。

### 主要ファイルのSHA-256

| ファイル | SHA-256 |
|---|---|
| `index.html` | `B1811613D283BFCE7E68A397C85CE294A70017889A6DF2A75584E0B8D71826BE` |
| `app.js` | `F93AB6C988BF11931DAE75DB26B5A5FF5D28D0D9CF7FB4D4EA117ADEF00D4DE4` |
| `styles.css` | `63E4FB55C97771B4BD38F339FC0100D8886E70CD9A304477E61DFE2AAA629961` |
| `tests/test-ui-static.js` | `222A8604BA92C13DCFB9452135F081B8EBB3A6849F71A953C1FD5E2986000ADF` |

## B-2026-08-24-23

- 状態: **検証済み・GitHub Pages公開済み**
- 検証日: 2026-08-24
- 実装コミット: `ba86c5e3574edd26ebfdca40eb6bed34d58387e1`
- 外部知能コミット: この項目を追加するコミット
- GitHub Pages: `built`、ビルド`1171689307`、コミット`ba86c5e3574edd26ebfdca40eb6bed34d58387e1`
- 公開URL: `https://iku190t.github.io/tokushima-survey-sekisan/`
- 内容: 4業務の作業追加フローを共通化し、確認チェックを撤去した。測量固有の適用範囲・条件表・補正を追加前に表示し、数量・必須条件・適用範囲の自動検証で追加可否と不足理由を表示する。選択した測量補正は明細へ保存する。

### 合格した試験・実画面確認

- `node --check app.js`、`node --check consulting.js`、`tests/test-*.js`全19本、`git diff --check`合格。
- ローカル実ブラウザーで設計・測量・調査計画・地質の作業区分、作業項目、計算根拠、数量、条件、追加、状態表示の順序が一致し、確認チェック0件であることを確認した。
- ローカルで測量`2-1-1`の地域・地形条件が未選択なら追加不可、標準条件選択後は追加可、追加明細へ「標準・指定なし（+0%）」が保存されることを確認した。
- 公開版で`styles.css?v=20260824-16`、`app.js?v=20260824-13`、確認チェック0件、測量条件未選択時の追加不可と理由表示、標準条件選択後の追加可を確認した。

### 主要ファイルのSHA-256

| ファイル | SHA-256 |
|---|---|
| `index.html` | `5DAE0B5F95A972D9E58088917C5E518C7B1D2DCB4126731C3ADAFF01B3E13B77` |
| `app.js` | `113AC7347748A188D64E7CF3993CB286C2998B154100AAD75097561F5CD6C60A` |
| `consulting.js` | `447073562CA06C2550542BB5D81B97A0AF38874244485CC00C7CF76D708989AC` |
| `styles.css` | `830F9BF9856104050E3793D7C0A4938514439B65CE8E1A597198B6C6F75DB488` |
| `tests/test-ui-static.js` | `1B69AD8CEEA1F2380DA804ADFBB4DD3E0175AC64EC6B4FB073A047226AE5445B` |
| `tests/test-consulting-ui.js` | `CDCD11991A17D5C8EB28504BBA7468DF7D1027B87F17D554CAB67C56F84E7473` |

## B-2026-08-24-24

- 状態: **検証済み・GitHub Pages公開済み**
- 検証日: 2026-08-24
- 実装コミット: `e7ec94be765b46e94751a1f08021ddaa7c336382`
- 外部知能コミット: この項目を追加するコミット
- GitHub Pages: `built`、ビルド`1171724182`、コミット`e7ec94be765b46e94751a1f08021ddaa7c336382`
- 公開URL: `https://iku190t.github.io/tokushima-survey-sekisan/`
- 内容: PDF取込の右入力欄をスクロール本文と固定フッターへ分離し、反映待ち追加・対象外の2ボタンを常時表示した。「確定前に必ず確認」カードを撤去してドロップ領域を全幅化し、PDF取込みタブを業務タブ側へ寄せた。

### 合格した試験・実画面確認

- `tests/test-*.js`全19本、`node --check document-import.js`、`git diff --check`合格。
- ローカル匿名デモPDFで右入力本文の先頭・最下部とも固定フッターと2ボタンが画面内にあり、作業項目だけの選択で追加ボタンが有効化され、反映待ち1件になることを確認した。
- ローカルで確認案内カード0件、取込カード幅1188px／画面幅1280px、PDF取込みタブ左端464px／地質タブ右端431pxを確認した。
- 公開版で`styles.css?v=20260824-17`、確認案内カード0件、取込カード全幅、PDF取込みタブ左端464px、右入力本文を最下部までスクロールした状態で確定2ボタンが表示されることを確認した。

### 主要ファイルのSHA-256

| ファイル | SHA-256 |
|---|---|
| `index.html` | `B4B4FD90DE746B7F21F54C2BE0B9F03666836521A95A28FB122E554810F23D59` |
| `styles.css` | `5358D46F93B162551CBD902EFC62656597D5FF20F57C1B2BBA9DD979CFB05F26` |
| `tests/test-document-import-ui.js` | `37D68F7A7C13508DE5C7525E7666300E1E7BB73424C9A2B8D364E5038F978EA9` |

## B-2026-08-24-25

- 状態: **検証済み・GitHub Pages公開済み**
- 検証日: 2026-08-24
- 実装コミット: `527a01b6ef18ede5b84c1dc2c1c2f51ec18369f1`
- 外部知能コミット: この項目を追加するコミット
- GitHub Pages: `built`、ビルド`1171742371`、コミット`527a01b6ef18ede5b84c1dc2c1c2f51ec18369f1`
- 公開URL: `https://iku190t.github.io/tokushima-survey-sekisan/`
- 内容: 4業務の作業追加ボタンを未入力時もクリック可能にし、追加操作時に不足理由を警告表示して該当欄へスクロール・フォーカス・強調する。検証失敗時は明細へ追加しない。

### 合格した試験・実画面確認

- `node --check app.js`、`node --check consulting.js`、`tests/test-*.js`全19本、`git diff --check`合格。
- ローカル実ブラウザーで設計・測量・調査計画・地質の未入力追加を操作し、各業務で警告、最初の不足欄へのフォーカス・強調、明細非追加を確認した。
- 公開版で現地測量`9-1-2`、数量`0.1km²`、条件表「縮尺・地域・地形（9-2）」未選択の状態から追加を押し、警告後に`scaleRegion`プルダウンへ移動・強調、測量明細0件、ブラウザー警告・エラー0件を確認した。

### 主要ファイルのSHA-256

| ファイル | SHA-256 |
|---|---|
| `index.html` | `5973CBF450956A4398579D713B10D97505CEBE70D27D0798CD6D8B4195EB0657` |
| `app.js` | `29D3791979FD4D4B6BCA744DED885980D4E752A6D68485042E053D8A0253266D` |
| `consulting.js` | `1A033511E9A30C67A71CF9AFE2AA6955DC946A468916D08A7E3EE075334D2479` |
| `styles.css` | `AA904883B960642EC9B97E418201D1AE02DF1218DB4863E7C678EEA5C1882BDC` |
| `tests/test-ui-static.js` | `1E65ED7AEC9522D92614AD17A018CF7D555B667E62C817A803FA4F9800EDE713` |
| `tests/test-consulting-ui.js` | `D978AE51B47E71CF67D92C92AF460BC69CFA409AC64D1A10565ECD68FB2DA962` |

## B-2026-08-24-26

- 状態: **検証済み・GitHub Pages公開済み**
- 検証日: 2026-08-24
- 実装コミット: `b5e6fb9fc65aa8ce7ce270416843083de5121024`
- 外部知能コミット: この項目を追加するコミット
- GitHub Pages: `built`、ビルド`1171760218`、コミット`b5e6fb9fc65aa8ce7ce270416843083de5121024`
- 公開URL: `https://iku190t.github.io/tokushima-survey-sekisan/`
- 内容: PDF取込開始画面の確認事項をファイル投下欄の右横へ小型配置した。右入力欄の反映待ち追加・対象外操作を上部へ移し、反映先とキーワード欄を段分離した。

### 合格した試験・実画面確認

- `tests/test-*.js`全19本、`git diff --check`合格。
- ローカル／公開版で、ファイル投下欄765.97pxと確認カード334.25pxが同じ上端・下端・高さ180pxで横並びになることを確認した。
- 公開匿名デモPDFで、右入力欄上部の「この作業項目を反映待ちへ追加」が有効・強調され、作業項目だけで反映待ち1件になることを確認した。
- 公開版で反映先プルダウン下端377.41px、キーワード欄上端400.41px、間隔23px、`styles.css?v=20260824-18`、ブラウザー警告・エラー0件を確認した。

### 主要ファイルのSHA-256

| ファイル | SHA-256 |
|---|---|
| `index.html` | `CC4E84AF10AAD3953BF1B7B1D991EC760AC609892630D29941298C1BA48558E9` |
| `styles.css` | `7C04A079FDFB6CC88511FE4E42EDE333C7FCA5C4CAA4E92AE40C7F78066C4BFD` |
| `tests/test-document-import-ui.js` | `BA7BF7EFE61FE0DA8AB6F5F6962D3F3E1BC34F19B539558E8CFD93AC2A81B2A9` |

## B-2026-08-24-27

- 状態: **検証済み・GitHub Pages公開済み**
- 検証日: 2026-08-24
- 実装コミット: `92c452bae6d75f721708b9e3288c1c0e32ff8aee`
- 外部知能コミット: この項目を追加するコミット
- GitHub Pages: `built`、ビルド`1171819577`、コミット`92c452bae6d75f721708b9e3288c1c0e32ff8aee`
- 公開URL: `https://iku190t.github.io/tokushima-survey-sekisan/`
- 内容: PDF対応付け画面上部の見出し・説明枠を撤去し、PDFと右入力欄を共通の拡張高さで表示する。

### 合格した試験・実画面確認

- `tests/test-*.js`全19本、`git diff --check`合格。
- ローカル／公開版で、対応付け画面直下の見出し0件・説明0件、PDFと右入力欄の上端9px・高さ680px一致を確認した。
- 1280×720環境で従来の約562pxから680pxへ約118px拡張し、右入力欄上部の反映待ち追加ボタンが表示されることを確認した。
- 公開版で`styles.css?v=20260824-19`、ブラウザー警告・エラー0件を確認した。

### 主要ファイルのSHA-256

| ファイル | SHA-256 |
|---|---|
| `index.html` | `F2329D9F1E4DB303B8473313E04D75027779F597476A912703B511EBA29F8E77` |
| `styles.css` | `49A938400F515E6712FA18CC6D74CAB1160485AD4117CDDBDA6CE5DCD0A9C7CA` |
| `tests/test-document-import-ui.js` | `F9C98F1DFBD9A3EA319AAD0D8CA6A8D6ADAA560690045EF53FA70BF9E8F02DFC` |

## B-2026-08-24-28

- 状態: **検証済み・GitHub Pages公開済み**
- 検証日: 2026-08-24
- 実装コミット: `cd48aa04255b077f472ffd4038a5ed7f6fdeb844`
- 外部知能コミット: この項目を追加するコミット
- GitHub Pages: `built`、ビルド`1171835847`、コミット`cd48aa04255b077f472ffd4038a5ed7f6fdeb844`
- 公開URL: `https://iku190t.github.io/tokushima-survey-sekisan/`
- 内容: PDF右入力欄の重複案内・可視補助見出し・未選択時メッセージを撤去し、パネル寸法を維持したまま主要文字を約1.2倍へ拡大した。換算結果は作業項目・数量・単位が揃った場合だけ表示する。

### 合格した試験・実画面確認

- `node --check document-import.js`、`tests/test-*.js`全19本、`git diff --check`合格。
- ローカル／公開匿名デモPDFで、右入力欄高さ680px、追加説明・作業区分見出し・数量単位見出し・未選択メッセージ0件を確認した。
- 見出し14px、キーワード見出し13px、ボタン11px、選択欄・ドロップ見出し12px、説明11pxを確認した。
- 作業項目だけの選択時は換算欄非表示、数量20・単位「点」入力後は「20点 ＝ 20点（積算へ反映）」を表示し、ブラウザー警告・エラー0件だった。
- 公開版で`styles.css?v=20260824-20`、`document-import.js?v=20260824-20`を確認した。

### 主要ファイルのSHA-256

| ファイル | SHA-256 |
|---|---|
| `index.html` | `D1EF420DBD8E0B2E8FC17B9A826C34B22B6E976F8EC885DDADAB2B0CBC7CB8FF` |
| `document-import.js` | `63E1681DA7A0DC741A82879297634343C408B90032F849DFA8F8AF70691C1C55` |
| `styles.css` | `08B24C065BAAE12C014C51CA5420ED249AC0E3A697C3EC767C231E4BA21B0260` |
| `tests/test-document-import-ui.js` | `F2B02ADF24E893C29A936235AAF0447BD6BECAF265BDD5081AB0C60A739EB723` |

## B-2026-08-24-29

- 状態: **検証済み・GitHub Pages公開済み**
- 検証日: 2026-08-24
- 実装コミット: `d35ae1f406913aac650a7d79a6fca9cc4100b938`
- 外部知能コミット: この項目を追加するコミット
- GitHub Pages: `built`、ビルド`1171855012`、コミット`d35ae1f406913aac650a7d79a6fca9cc4100b938`
- 公開URL: `https://iku190t.github.io/tokushima-survey-sekisan/`
- 内容: スマホ幅ではPDF・写真取込の導線と画面を非表示・操作不可にし、PCでは従来機能を保持する。web積算専用のショートカットアイコンをfavicon・Apple Touch Icon・Web App Manifestへ設定した。

### 合格した試験・実画面確認

- `node --check app.js`、`node --check document-import.js`、`tests/test-*.js`全19本、manifest JSON解析、`git diff --check`合格。
- ローカル／公開版の1280pxでは取込ボタン表示・取込画面起動、390pxでは取込ボタン`display:none`・`hidden`、取込画面非表示、設計業務への自動復帰を確認した。
- 32／180／192／512pxアイコンの画像寸法、ローカルHTTP 200、公開版のfavicon・manifest参照を確認した。
- 公開版で`styles.css?v=20260824-21`、`app.js?v=20260824-15`、ブラウザー警告・エラー0件を確認した。

### 主要ファイルのSHA-256

| ファイル | SHA-256 |
|---|---|
| `index.html` | `45DF59E2B07162B11254E976D41CE2C01843881329847533F09E4879BA4EE8FE` |
| `app.js` | `0B49A9FA09CE1C328C615A9DDA47EDF7666BE12F5994B4222B3E5818BE2D5800` |
| `document-import.js` | `A70D17D0BC594321C601969AD57F272E80F3487291227D92B14B22956D2564D5` |
| `styles.css` | `40D7443EEF1DFAD7C3C57F5D52CCEFECE20F7528954A1F58434E1133C994DF0E` |
| `site.webmanifest` | `D910CA21E4AC5DFABF3A581679782985D5E0168C33ED8DBFC231B0E0DDF0A69E` |
| `web-sekisan-32.png` | `350B760C8A1CC525598BD96516E0F01C74E0734F1064A60306D6E8DE38DCA280` |
| `web-sekisan-180.png` | `4432D31938A8BB3BD5AA8803AAEBA6F86A44BC85CA742AE223C16C3378119DB0` |
| `web-sekisan-512.png` | `B4AB268CD42C867347A11FD975A9A0B7D71DB5439A40F7E4A2A4BAFC78AC77DE` |
| `tests/test-ui-static.js` | `06A847DF2E07E1F360915FF088DF13B3E996068B66DF1035E1D69299BBC7CCF3` |

## B-2026-08-25-01

- 状態: **検証済み・GitHub Pages公開済み**
- 検証日: 2026-08-25
- 実装コミット: `aa0937315fcf4c490134fc5fc324ae60e611aa7e`
- 公開キャッシュ更新コミット: `ced06713e108d8c89bfabf4dc9821a45285166c4`
- 外部知能コミット: この項目を追加するコミット
- GitHub Pages: `built`、コミット`ced06713e108d8c89bfabf4dc9821a45285166c4`、更新時刻`2026-08-24T23:25:26Z`
- 公開URL: `https://iku190t.github.io/tokushima-survey-sekisan/`
- 内容: 4業務の現場条件を同一積算・業務区分内の後続作業へ継承し、年度・基本情報・費用条件・PDF取込み絞込み・帳票設定を前回データ復元時に戻す。新規積算は現場条件と絞込みを初期化する。

### 合格した試験・実画面確認

- `node --check app.js`、`node --check consulting.js`、`node --check document-import.js`、`tests/test-*.js`全19本、`git diff --check`合格。
- ローカルで測量の森林・丘陵地／交通量条件を次の路線測量項目へ継承し、設計の地形・車線・特殊法面条件を別の道路設計項目へ継承することを確認した。
- 新規積算では測量条件とキーワードが初期化されることを確認した。
- PDF取込みで設計業務／道路／道路詳細設計を保存し、再読込み後に前回データを復元すると同じ絞込みへ戻ることを確認した。
- 公開版で3スクリプトの`v=20260825-1`、タイトル、復元案内、ブラウザーエラー0件を確認した。

### 主要ファイルのSHA-256

| ファイル | SHA-256 |
|---|---|
| `app.js` | `49DAC656F5775108CCC8EAB53C179DC96037014B0CE00598118D6B3EEA00F48F` |
| `consulting.js` | `E347FE7E74927204341D2B9E7B04E33BD6770B89DA480484AF4A9CC543CB8E90` |
| `document-import.js` | `B670D5A886D0353F08FB8AEEC65BDCA2EBD2E7BC599CCCD801BDB87844758DD6` |
| `index.html` | `BBDFE1A482C402FB58AE9D98C988FD20B7CCA0A02E81707751CD95060BF7C082` |
| `tests/test-ui-static.js` | `E97F100A0A4D34620F7DF099EBB6BD1EB8682162CFE055CB98085EB5BE0C331C` |
| `tests/test-consulting-ui.js` | `E5BC83F94FF1F5D1AD3C22ED19935EF36A8E84FD657BA7621B337BBF8BCDAD39` |
| `tests/test-document-import-ui.js` | `127A9C89C61A72252CF50D6C0DE881EE47A061146084BAA8626461C626F45D74` |

## B-2026-08-25-02

- 状態: **検証済み・GitHub Pages公開済み**
- 検証日: 2026-08-25
- 実装コミット: `4a8d546fc896a93a7217addbbae23c0f7f6a5507`
- 外部知能コミット: この項目を追加するコミット
- GitHub Pages: `built`、コミット`4a8d546fc896a93a7217addbbae23c0f7f6a5507`、更新時刻`2026-08-24T23:55:27Z`
- 公開URL: `https://iku190t.github.io/tokushima-survey-sekisan/`
- 内容: アイコン案4の数量表・定規・三角定規を正式アイコンへ採用し、ブラウザー、Apple Touch Icon、Web App Manifestへ反映した。

### 合格した試験・実画面確認

- `node tests/test-ui-static.js`、Manifest JSON解析、32／180／192／512px寸法検査、`git diff --check`合格。
- 180pxと32pxの透過PNGを目視し、180pxで数量表・定規、32pxで緑の積算表を識別できることを確認した。
- 公開ページHTTP 200、`v=20260825-2`、公開180px画像とローカル画像のSHA-256一致を確認した。

### 主要ファイルのSHA-256

| ファイル | SHA-256 |
|---|---|
| `index.html` | `B2848244E982C8CF01FA336DC8B215101E3886F36DF2ABA11E6EB17124D9E49C` |
| `site.webmanifest` | `C9AF51EFC52668488E314464E55C02E80E6AC1CE91C2BE36D9370F852378A544` |
| `web-sekisan-source.png` | `A4E60F3E483961FE2B53CD6DCBC947D76EF243EC5D1E6BFF787D8856CF2DA47E` |
| `web-sekisan-32.png` | `08ECFFD160F067820F5ED77F200BB3C7865EE7DDDFE6BE51F958BD39E6DA40E1` |
| `web-sekisan-180.png` | `297ED7691394A1E15ECDE64301DA4D60D7ED0C9E3A8995845468BD27B53D158B` |
| `web-sekisan-192.png` | `0DEAE6A075E517E0F4AA8E225D130F6158BE6DCA8F1DB6F21312D359B93164D7` |
| `web-sekisan-512.png` | `EEBA88DA80331003ED0DA44FEE41D61B12FA3EB5498B7947856F402E133D3600` |
| `tests/test-ui-static.js` | `E69ACB31940BCCEDF7BD8AD5133A0CF5EA7253076ACF91BA46B69ABDF555A299` |
