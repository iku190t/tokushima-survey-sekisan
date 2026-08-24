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
$voice.Rate = 2
$voice.Volume = 100
$format = New-Object -ComObject SAPI.SpAudioFormat
$format.Type = 22
$stream = New-Object -ComObject SAPI.SpFileStream
$stream.Format = $format
$stream.Open($OutputPath, 3, $false)
$voice.AudioOutputStream = $stream
$text = @'
web積算は、設計、測量、調査計画、地質の四業務を、共通画面で扱う参考積算ツールです。キーワードで作業を選び、項目ごとの単位で数量を入れると、内訳と合計を自動計算します。PDFや写真も読み込めます。これは匿名の紹介用PDFです。項目名、数量、単位を、PDF横の緑枠へ順番にドラッグし、確認して反映待ちへ追加します。そのまま次の行も続けて処理できます。PDF先頭の高確度な業務見出しは、四業務共通の業務名へ自動入力します。令和六年度から令和八年度を切り替え、見積書、積算内訳、計算根拠を帳票PDFへまとめられます。利用時は発注者の基準と必ず照合してください。
'@
[void]$voice.Speak($text)
$stream.Close()
