# データ、出典、権利

## 出典と加工

| 対象 | 基礎となる素材 | この配布物での扱い |
| --- | --- | --- |
| 道路網・湖岸・建物の輪郭 | © OpenStreetMap contributors | ゲーム用ルート・形状へ加工。ODbLの適用に注意 |
| 標高・地形 | 国土地理院 | 地形メッシュの基礎。出典を維持して加工 |
| KUROTORA・沿道・植生等の制作モデル | プロジェクト所有者が提供した制作資産 | ブラウザで使えるGLBと配置データへ変換 |
| Three.js r186 | Three.js authors | ES Modulesを同梱、MIT全文を保持 |
| Meshoptimizer 1.1 | Arseny Kapoulkine | decoderを同梱、MIT全文を保持 |

- [OpenStreetMapの著作権とライセンス](https://www.openstreetmap.org/copyright)
- [国土地理院コンテンツ利用規約](https://www.gsi.go.jp/kikakuchousei/kikakuchousei40182.html)
- [地理院タイル一覧](https://maps.gsi.go.jp/development/ichiran.html)
- [Three.jsライセンス](../dist/vendor/LICENSE)
- [Meshoptimizerライセンス](../dist/vendor/MESHOPT-LICENSE.md)

原データの取得時点やすべての元データ識別子を、この配布物だけから再現できるとはしていません。将来の更新では、使った原データの版・取得日・変換条件を保存してください。

## 精度と表現

表示ルートは実地図の接続関係をもとに、走りやすさのため平滑化しています。道路幅、沿道の細部、建物の外観、植生、材質には制作上の推定が含まれます。実際の交通規制・路面状態・安全性を示すデータではありません。特定の作品のコースを公式に検証した再現でもありません。

GLBはMeshoptで圧縮しています。現在の制作工程では量子化を使わず、復号したgeometry bufferと圧縮前bufferのbyte一致を確認しています。ただし、Blenderからブラウザへ移す際の材質表現やLOD、光の計算は同一ではありません。

## 再利用の範囲

公開リポジトリで読めることは、すべての原コード・画像・3Dモデルを自由に再配布できることを意味しません。

- OSM由来データはODbL、国土地理院コンテンツは該当する利用規約に従います
- Three.jsとMeshoptimizerは同梱したMIT条件に従います
- その他の原コード・制作モデル・画像には、このリポジトリから包括的な再利用許諾を追加していません。権利は各権利者に帰属します
- 第三者素材を追加するときは、出典・権利者・利用条件・加工内容を記載してください

[LICENSE.md](../LICENSE.md)が権利範囲の入口です。

## プレビュー画像

`docs/assets/blender-course-preview.png` はBlenderで撮影した制作モデルの試写です。ブラウザ実行の証拠、FPSの測定、ゲーム画面のスクリーンショットとしては扱いません。
