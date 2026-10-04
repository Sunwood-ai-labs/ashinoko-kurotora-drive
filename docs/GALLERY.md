# Gallery · 画像の出典と撮影メモ

[English README](../README.md) · [日本語README](../README.ja.md)

## What these images show / 画像の位置づけ

These are real Blender renders of the project's production models. They are not AI-generated scenery, photographs of the real road or screenshots of the running browser game. The original render dimensions and composition are retained, without generative retouching or upscaling. Larger images use lossy JPEG delivery copies; smaller PNGs retain identical decoded pixels after removal of nonvisual metadata. Original PNGs are preserved separately.

実際の制作モデルをBlenderで描画した画像です。生成AIで補った風景、現地の写真、ブラウザゲーム実機スクリーンショットではありません。元レンダーの解像度と構図を保ち、生成補正・引き伸ばしはしていません。大きい画像は非可逆の配信用JPEG、小さいPNGは画素を変えず非表示metadataを除いた版です。元PNGは別途保持しています。

- **Base study / 地形ベース**: the wide lake panorama and overhead route explain the geography and scale. They show an earlier production stage, before full-course vegetation and roadside refinements. The overview's embedded 25.04 km label describes that earlier plan; the current v4 route is 25,031.460 m (approximately 25.03 km). The raised orange line is a presentation aid, not a runtime asset.
- **v3 detail sector / v3詳細区間**: the outside S-bend and close guardrail views show the western detail sector. Its road, rail, drainage and stonework were carried into v4. Later terrain-material, vegetation and grounding changes mean these are not exact captures of the final v4 scene.
- **v4 route QA / v4全周確認**: the 640 × 400 images are physical cameras from the all-route inspection, named by approximate historical route station. They use Cycles, 16 samples and no denoising. Station labels are presentation references, not geographic coordinates or precise markers on the revised runtime route. These are production QA captures, not a promise of browser materials, LOD or frame rate.

地形ベース2枚は全周の追加整備前の制作画像です。俯瞰図内の25.04 km表記は旧計画時点の数値で、現v4の距離は25,031.460 m（約25.03 km）です。オレンジ色の線は説明用の強調表示です。v3の道路・レール・側溝・石積みはv4へ継承しましたが、地面材質や植生などは後に更新されています。v4の小画像は640 × 400、16サンプル、ノイズ除去なしの全周確認画像です。距離表示は旧確認カメラの目安で、現ルートの厳密な位置表示ではありません。

Browser rendering, controls and hardware performance remain a separate acceptance task. See [verification limits](VERIFICATION.md). Low-sample render noise remains visible in some images; this is retained rather than hidden with invented detail.

ブラウザでの実描画・操作・端末性能は別の受入確認です。[検証の限界](VERIFICATION.md)を参照してください。低サンプルのノイズは、架空のディテールで補わずそのまま残しています。

## Source inventory / 元画像一覧

The cover is a 1920 × 1080, 24-sample Cycles production preview of KUROTORA on the western presentation sector. It predates the later lakeside camera pass. The vehicle belongs to the game, not the course pack.

表紙は西側制作区間のKUROTORAを描画した1920 × 1080・24サンプルのCycles試写です。後の湖畔カメラとは別のカットです。車体はゲーム側の資産で、コースパックには含まれません。

| Image / 画像 | Production stage / 制作段階 | Original filename / 元ファイル名 | Resolution / 解像度 | Delivery encoding / 配信形式 |
|:---|:---|:---|:---|:---|
| [blender-course-preview.jpg](assets/blender-course-preview.jpg) | v4 production preview, western presentation sector | `v4_1080p_quality_trial.png` | 1920 × 1080 | JPEG quality 85, 4:4:4, progressive |
| [lake-panorama.jpg](assets/gallery/lake-panorama.jpg) | Base-model landscape study | `12_lake_and_road_overlook.png` | 1440 × 900 | JPEG quality 95, 4:4:4, progressive |
| [skyline-curve.jpg](assets/gallery/skyline-curve.jpg) | v3 western detail sector | `17_v3_curve_outside.png` | 1440 × 900 | JPEG quality 93, 4:4:4, progressive |
| [roadside-detail.jpg](assets/gallery/roadside-detail.jpg) | v3 western detail sector | `18_v3_roadside_closeup.png` | 1440 × 900 | JPEG quality 95, 4:4:4, progressive |
| [forest-bend-v4.png](assets/gallery/forest-bend-v4.png) | v4 route QA · 6 km camera | `route_06000m.png` | 640 × 400 | PNG; nonvisual metadata removed |
| [lake-road-v4.png](assets/gallery/lake-road-v4.png) | v4 route QA · 12 km camera | `route_12000m.png` | 640 × 400 | PNG; nonvisual metadata removed |
| [town-climb-v4.png](assets/gallery/town-climb-v4.png) | v4 route QA · 21 km camera | `route_21000m.png` | 640 × 400 | PNG; nonvisual metadata removed |
| [course-overview.jpg](assets/gallery/course-overview.jpg) | Base-model route overview | `07_complete_course_overview.png` | 1440 × 1080 | JPEG quality 95, 4:4:4, progressive |

## Delivery integrity / 配信画像の記録

JPEGs are lossy derivatives at the original pixel dimensions. Quality is listed above; all use 4:4:4 chroma and progressive encoding. PNG metadata removal changes file bytes but preserves decoded pixels exactly. No scene details were synthesized or selectively retouched. The table records source and delivery SHA-256 values separately.

JPEGは原寸の非可逆派生版です。上表にqualityを記録し、4:4:4・progressiveで保存しています。PNGは非表示metadataだけを除き、復号後の画素完全一致を確認しました。形状の生成補正や部分的な修正は行っていません。元PNGと配信画像のSHA-256を区別します。

| File | Source PNG SHA-256 | Delivery SHA-256 |
|:---|:---|:---|
| `blender-course-preview.jpg` | `fe3780bd3c7e60d60d882e6e4df8bec47052e7e2e1caa6ec29164a7066be4bd4` | `6cf72f9275b75d9ad021fe5a4cb078dccac2d4671e92bdbd8f3349c64c435fab` |
| `lake-panorama.jpg` | `14c876fc18f6e219d57781b870f2006cdeb82a910ac1d81f9127d2c5b1722df4` | `de580e98b9aac5f4f6d90581de997ab49cc6a6d20e233d825d89e3c27421e71f` |
| `skyline-curve.jpg` | `e44a46108af39de595e116bfa43ccacf255f9c183c4eb0a1d2a5844956575332` | `e8405b536aabc22cc6173f9ef9232ed93599fb4df6e899992c663e0dee71f010` |
| `roadside-detail.jpg` | `37c2aa67ed48cd0fb63f896b6a2c5b24c600e43176595a1f93f1680342ccd9c4` | `c9def5f7f960ccce1c428e8691838966c4b54440d741b4f11ca588a316e031cf` |
| `forest-bend-v4.png` | `2ffca89a861bd16882e3cd7d49e6868da4c5fa65ffe390b92e1208cfc7cb7f02` | `6df7fb7c78b059dc03e241bde8d1c80db2352d0de69871ca437ef90c6071f10c` |
| `lake-road-v4.png` | `32f7ed06000f13dd9aafd752bb69c253922b80c100021d0128348e398aeb7dce` | `5990327d8a140ec4021b71dd793cd5508cf36780a69e0b069ebd88b8e10e505c` |
| `town-climb-v4.png` | `437996c23b6f38d6608f98e210e543b854d180d8f742cfa563f3d950308d143d` | `59a600458d6a03d39650ac1c882f915b7e8555c22536ee87518f8a8c52bce786` |
| `course-overview.jpg` | `1870e3616f27a8b1255a5f3b2590a0917463689eb89b54463b575f25cb7504e5` | `c2eeef4b7d6210639b001650610f5fd8b8518d0b9d6c8e0526a451aeaaaf7ff1` |

Production metadata is omitted from the current gallery files. Existing Git history is preserved, so older image versions in history may still contain their original production metadata. This is not a history purge.

現行ギャラリー画像から制作metadataを除いています。Git履歴は保持しているため、履歴中の旧画像には当時の制作metadataが残る場合があります。過去履歴の完全除去ではありません。

## Attribution and rights / 出典と権利

Map-derived roads, lake outline and building bases: © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), under the applicable ODbL terms. Elevation source: [Geospatial Information Authority of Japan](https://www.gsi.go.jp/kikakuchousei/kikakuchousei40182.html). Widths, smoothing, vegetation, road furniture and architectural detail include artistic reconstruction.

道路・湖岸・建物の基礎はOpenStreetMap、標高は国土地理院に基づきます。道路幅、平滑化、植生、道路設備、建物の詳細には芸術的補完があります。現地の再現精度や実道路の安全性は保証しません。

Existing rights remain unchanged. Adding a gallery does not grant a new blanket license for the original artwork, geometry or vehicle. See [LICENSE.md](../LICENSE.md) and [data sources](DATA.md).

ギャラリーの追加によって原画像・形状・車体へ新しい包括的利用許諾を与えるものではありません。[権利範囲](../LICENSE.md)と[データの出典](DATA.md)を確認してください。
