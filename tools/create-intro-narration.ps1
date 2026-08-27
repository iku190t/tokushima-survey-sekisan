param(
  [Parameter(Mandatory = $true)]
  [string]$OutputPath
)

$ErrorActionPreference = 'Stop'
$voice = New-Object -ComObject SAPI.SpVoice
$japaneseVoice = $voice.GetVoices() | Where-Object { $_.GetDescription() -match 'Japanese|Haruka' } | Select-Object -First 1
if ($null -eq $japaneseVoice) {
  throw 'Japanese SAPI voice is not installed.'
}
$voice.Voice = $japaneseVoice
$voice.Rate = -1
$voice.Volume = 100
$format = New-Object -ComObject SAPI.SpAudioFormat
$format.Type = 22
$stream = New-Object -ComObject SAPI.SpFileStream
$stream.Format = $format
$stream.Open($OutputPath, 3, $false)
$voice.AudioOutputStream = $stream
$segments = @(
  '積算の作業、項目を探すところから大変ではありませんか。Web積算なら、設計、測量、調査計画、地質を、ひとつの画面で整理できます。',
  'まずは業務を選びます。キーワードを押すだけで候補が絞られ、作業区分、作業項目、数量を、同じ順番で入力できます。',
  '測量では、基準点、水準、現地、UAV、レーザーなどを、一覧からすばやく選択。項目に合った単位と入力桁で、入力ミスも防ぎます。',
  '数量と必要な条件を入れると、内訳と合計をすぐに再計算。同じ業務の現場条件は、次に追加する項目へ自然に引き継がれます。もちろん、手動で変えた値が最優先です。',
  'PDFから始めるときは、資料をそのまま読み込みます。ここでは、個人情報を含まない紹介用PDFを使っています。',
  'PDFの作業項目を、右の入力欄へドラッグ。数量や単位がまだ分からなくても、項目だけ先に反映待ちへ追加できます。',
  '数量と単位がそろった行は入力完了。未入力の行は、数量未入力と表示されるので、どこまで作業したか迷いません。',
  '追加した明細では、数量換算、補正条件、計算式、出典資料をひとつの場所で確認できます。確認できない項目を、無理に金額へ置き換えることもありません。',
  '令和六年度から令和八年度まで切り替え、見積書、積算内訳、計算根拠を、整ったPDFで出力できます。会社情報は端末に保存され、次回の入力も省けます。',
  '選ぶ。確認する。帳票にする。積算の流れを、ひとつの画面で。Web積算です。'
)
foreach ($segment in $segments) {
  [void]$voice.Speak($segment)
  Start-Sleep -Milliseconds 650
}
$stream.Close()
