# Repository polish / リポジトリ整備記録

2026-10-04に [Sunwood-ai-labs/repository-polish-skill](https://github.com/Sunwood-ai-labs/repository-polish-skill) を適用しました。別のrelease-notesスキルによる代用ではありません。

- 適用元commit：`89e98c167fb3d9475763311b562e15bfc62e8970`
- SKILL.md SHA-256：`e7a7364ab46eddacd6472d938ef55e698f8b54905f71129fd6575d75fcf0750d`
- 作業環境内へskillをインストールし、SKILL.md、4つの参照文書、2つの監査スクリプトを確認
- 上流にLICENSEファイルが見当たらないため、このrepoへスキル本文やスクリプトは再配布せず、出典と版だけを記録
- PowerShellがないため上流の `.ps1` は実行せず、同等のfilesystem/git inventoryとpayloadサイズの確認をNode/Gitで実施

## 適用した項目

ゲームとコースの正本を別repoにし、出典付きの固定snapshotとimport/exportを用意しました。日英README、責務、開発・更新・ロールバック、検証の限界、貢献・セキュリティ・権利文書、CI、文書リンク検査、配布ファイルサイズとチェックサムを確認します。

新しいVitePress依存や重複したPagesサイトは追加していません。ゲームには既存の公開プレイ画面があり、コースにはGitHubのREADMEと用途別Markdownガイドが適しています。スキルの「必要な場合にdocsサイトを追加する」方針に合わせています。

## 判定の基準

テストとデータの整合性、実ブラウザの描画確認、GitHubへの反映、Actionsの実行結果は別々の確認です。ローカルでファイルを作っただけで公開済みとはしません。最終公開commitのCI・配信状況は対象repoのActionsで確認します。

3D描画・実操作・FPSの受入確認は未完了です。READMEの画像はBlender試写と明示し、ゲームスクリーンショットや実行成功の証拠にしていません。既存のライセンス・出典を保持し、履歴の書き換えや一律MIT化は行いません。


## 画像ギャラリーの拡充 / Expanded visual gallery

2026-10-04に、README日英を表紙込み8枚の実Blenderレンダー構成へ更新しました。湖と山並みの全景、外側カーブ、路肩ディテール、森、湖畔、坂道と建物、ルート俯瞰を使い分けています。画像の並びと説明は日英で対応させ、制作段階と解像度を[画像の出典](GALLERY.md)に記録しました。ゲームの表紙には車体、コースの表紙には湖と道路の関係を置いています。

元PNGを別保持し、原寸の配信用JPEGと非表示metadataを除いたPNGを使用しています。JPEGの非可逆変換・quality・元/配信SHA-256を記録し、PNGは画素完全一致を確認しました。生成画像・生成補正・引き伸ばしは用いていません。旧制作段階のカットを現在のブラウザ画面や最新v4画面と見せかけず、各captionで区別しています。runtime、コース契約、lock、release、公開URL、原資産、権利には変更を加えていません。

公開画像の制作metadataを除去し、旧hero PNGは現行treeから外しました。元画像とGit履歴は保持し、過去履歴中の旧metadataを完全除去したとは扱いません。
