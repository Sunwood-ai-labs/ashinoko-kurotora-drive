# 芦ノ湖 GT · KUROTORA DRIVE

芦ノ湖周辺の実地図・標高データをもとにした、約25.03 kmの3Dブラウザドライブゲームです。KUROTORAを手動操作するか、自動走行で風景を楽しめます。

## 遊び方

WebGLに対応する最新のブラウザで開き、読み込み完了後に「手動で走る」または「自動走行で出発」を選びます。

- W / ↑：アクセル
- S / ↓ / Space：ブレーキ
- A / D または ← / →：ステアリング
- R：現在位置付近のコースへ復帰
- P：一時停止・再開
- M または「自動走行」ボタン：自動走行の切り替え
- 自動走行中にアクセル・ブレーキ・ステアリングを操作すると手動に戻ります
- タッチ端末は画面のハンドル・ペダルボタンで操作できます

タブを離れると一時停止します。復帰後に「再開」を押してください。1周で終了します。

## ローカル起動

Python 3とNode.js 22以上を使用します。実行時の外部CDN依存はありません。

```sh
npm test
npm start
```

ブラウザで http://localhost:8000 を開きます。ファイルを直接開く方法ではなく、HTTPサーバーを使ってください。

## GitHub Pages

Settings → Pages → Source を GitHub Actions に設定します。mainへのpushで物理挙動・自動走行完走・配布ファイルの検査を実行し、distを公開します。相対URLなのでリポジトリ名を含むPagesのパスに対応しています。

配布ファイルを編集したら、`node tools/checksums.mjs` でSHA-256一覧を更新してから `npm test` を実行してください。CIでは、公開対象と一覧の一致も検査します。

## モデルと精度

地図に基づいた地形・道路のアーケード試作です。道路幅、路面、風景、車両挙動は近似であり、実道路の安全確認や正確なシミュレーションには使用できません。3Dデータの初回読み込みには時間がかかる場合があります。

## 出典・権利

- 道路・湖岸データ：© [OpenStreetMap contributors](https://www.openstreetmap.org/copyright)（ODbL）
- 地形・標高：国土地理院。利用条件は[国土地理院コンテンツ利用規約](https://www.gsi.go.jp/kikakuchousei/kikakuchousei40182.html)を参照
- Three.js：MIT。全文はdist/vendor/LICENSE
- Meshoptimizer：MIT。全文はdist/vendor/MESHOPT-LICENSE.md
- KUROTORAおよび制作したビジュアル資産：権利は各権利者に帰属します。GitHubでの公開は、それらの第三者による再利用・再配布を包括的に許諾するものではありません

ライセンスの適用範囲はLICENSE.mdを確認してください。
