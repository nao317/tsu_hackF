Liftkit コンポーネント導入手順

1. LinkKit CLI で必要なコンポーネントを追加します（例）:

   - バッジ: `npm run add badge`
   - ボタン: `npm run add button`
   - カード: `npm run add card`

2. 追加後、各コンポーネントを該当ファイルで import してください。
   例: `import { Button } from 'liftkit'` など（導入後のドキュメントを参照）

3. 既存のプレースホルダコンポーネント（`frontend/src/components/*`）をLiftkitコンポーネントに差し替えます。

注意: まずは今回追加したプレースホルダで動作確認してください。Liftkit の導入はプロジェクト依存のため、環境で CLI を実行してから差し替えることを推奨します。
