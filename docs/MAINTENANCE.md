# 更新・検証・配信

## 普段の変更

1. 変更前のcommitと対象を確認する
2. ゲームの操作・描画はゲーム側、地形・風景・配置はコース側で変更する
3. コース契約を変更した場合はmanifestの版・schema・読込テストを揃える
4. コース変更時は `npm run course:checksums`、続けて `npm run checksums` で配布チェックサムを更新する
5. `npm test` を実行する
6. HTTPサーバーで実ブラウザを開き、下記の操作と描画を確認する
7. 差分に秘密、個人情報、内部パス、原ログ、未許諾素材がないことを確認してPRを出す

チェックサムを更新するだけでは検証になりません。意図したデータ変更であることを先に確かめてください。

## データの再生成

このリポジトリで行えるのは、同梱されたパックの索引・manifest・検証結果・チェックサムの更新です。制作時の原Blenderファイル、取得した原地図・DEMの完全な作業セットは公開物に含めていません。原形状からの完全な再生成には、権利を確認したそれらの入力と制作工程が別途必要です。

元のGLBを無根拠に再最適化したり、頂点・配置精度を削ってサイズを小さくしないでください。更新時には車体寸法、材質、路面との関係、全周植生、圧縮前後のgeometry bufferを検査します。大きなJSONは、値と順序を維持した複数ファイルに分けて索引から参照します。

### パックの検証と分離export

```sh
npm run course:validate
node scripts/course-pack.mjs --assets-dir dist/assets --runtime dist/course-loader.mjs --export /tmp/ashinoko-course-export
node scripts/course-pack.mjs --assets-dir /tmp/ashinoko-course-export --runtime dist/course-loader.mjs
```

export先には新しい空フォルダーを指定します。車体を含めない24のパック資源と、そのSHA-256一覧を書き出します。所有者の原資産に新しい再配布許諾を与える操作ではありません。別リポジトリに移す場合は、出典・権利文書と契約schemaも一緒に管理してください。

## 手動の受入確認

- 読み込み完了後の手動・自動開始、切り替え、再スタート
- 加速、左右操舵、ブレーキ、路肩接触、コース復帰
- 一時停止、別タブへの移動と復帰、連打、タッチの同時入力
- 全周の路面の埋没・段差、車体、影、植生、沿道、ゴール
- WebGL非対応時の説明と再読み込み、描画contextを失った場合の停止
- 対象端末でのFPS、メモリ、初回ロード時間

測定していない項目は未検証のまま記録します。Blenderの画像でゲーム実行の確認を代用しません。

## CIとGitHub Pages

`.github/workflows/pages.yml` がPRとmainへのpushで検証します。PRからは公開せず、mainの検証に成功した場合だけ `dist/` をPagesへ送ります。Pages設定のSourceは **GitHub Actions** です。

検証ジョブの権限はリポジトリの読み取りのみです。PagesとOIDCの書き込み権限はデプロイジョブだけに付与します。アプリ用の秘密情報や追加のデプロイキーは不要です。

公開後は、Actionsのcommit、validate/deployの成功、公開URLの実表示を対応付けて確認します。CDNキャッシュにより反映直後は古いファイルが見える場合があります。

## ロールバック

問題のある変更を、履歴を残すrevert commitでmainから取り消します。`tools/distribution-checksums.json` もコードと同じ版へ戻してください。正常だったcommitのCIを再確認してから公開し、配信後の実画面を確認します。共有mainのforce pushや、復旧できないデータ削除を通常の手順にしないでください。

## 同梱ライブラリを更新する

Three.jsはcore・module・loader・utilsを揃え、Meshoptimizerはdecoderと対応する圧縮形式を検査します。出典とライセンスを維持し、構文・データdecode・操作・表示の回帰確認後にチェックサムを更新します。単一ファイルだけを別の版へ差し替えないでください。
