/**
 * server.js
 * Express サーバー：静的ファイル配信 + Claude API チャット中継
 *
 * 起動前に環境変数 ANTHROPIC_API_KEY を設定してください。
 *   export ANTHROPIC_API_KEY="sk-ant-..."
 */

import Anthropic from '@anthropic-ai/sdk';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

// .env ファイルを読み込んで環境変数に反映（dotenv 不要の簡易実装）
try {
  const envPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '.env');
  const lines = readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val; // 既存の環境変数を上書きしない
  }
} catch {
  // .env がなければスキップ
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app  = express();
const PORT = 3456;

// Claude クライアント初期化（ANTHROPIC_API_KEY 環境変数を自動参照）
const anthropic = new Anthropic();

// ===================================================
// チャットボットのシステムプロンプト
// ===================================================
const SYSTEM_PROMPT = `あなたは「小児訪問看護ステーション ルバート（株式会社Cantabile）」のウェブサイトに設置されたAIアシスタントです。
お子さまの訪問看護・リハビリに関心を持つご家族からの質問に、温かく親切に日本語でお答えください。

【施設情報】
- 施設名：小児訪問看護ステーション ルバート
- 運営法人：株式会社Cantabile
- 対象：小児（お子さま）
- サービス種別：訪問看護（PT・ST・看護師）

【ルバートの特徴・強み】
1. リハビリに強い訪問看護：自宅でPT（理学療法）・ST（言語聴覚療法）を受けられる
2. ST（言語聴覚士）が複数名在籍：小児対応可能なSTは数が少なく、希望しても受けられない方の受け皿となることを目指している
3. 全員が小児対応の経験者：看護師・リハスタッフ全員が小児専門病院や療育センター出身
4. 遊びを取り入れたPTのリハビリ：お子さまが楽しみながら身体機能を伸ばすアプローチ
5. STは「伝えたい」を引き出すスタイル：ことばを教えるのではなく、自然に言葉が出る環境づくりを重視
6. 看護師・PT・STがチームで連携：お子さまの状態をチーム全体で共有しながら支援

【対応ガイドライン】
- 保護者の方が不安を感じていることが多いため、寄り添う言葉遣いを心がけてください
- 具体的な費用・医療的判断・診断については「詳しくはお電話またはお問い合わせフォームでご相談ください」と案内してください
- ことばの発達・嚥下・リハビリに関する一般的な情報はお伝えして構いません
- わからない質問には正直に「スタッフに直接ご相談ください」と伝えてください
- 回答は簡潔にまとめ、200文字程度を目安にしてください
- 最後に必要に応じて「お気軽にご相談ください😊」などの温かい一言を添えてください`;

// ===================================================
// ミドルウェア
// ===================================================
app.use(express.json());
// 静的ファイル（index.html / style.css / script.js）を配信
app.use(express.static(__dirname));

// ===================================================
// チャット API エンドポイント（SSE ストリーミング）
// ===================================================
app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;

  // 入力チェック
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messagesが不正です' });
  }

  // SSE（Server-Sent Events）ヘッダーを設定
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // nginx 等のバッファリングを無効化

  try {
    // Claude API をストリーミングで呼び出す
    const stream = anthropic.messages.stream({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: messages,
    });

    // テキストデルタをリアルタイムでクライアントに送信
    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        // JSON エスケープしてから送信
        const data = JSON.stringify({ text: event.delta.text });
        res.write(`data: ${data}\n\n`);
      }
    }

    // ストリーム終了を通知
    res.write('data: [DONE]\n\n');
    res.end();

  } catch (err) {
    console.error('Claude API エラー:', err);

    // APIキー未設定などのエラーをクライアントに通知
    const errorMsg = err.status === 401
      ? 'APIキーが正しく設定されていません。'
      : `エラーが発生しました: ${err.message}`;

    res.write(`data: ${JSON.stringify({ error: errorMsg })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

// ===================================================
// サーバー起動
// ===================================================
app.listen(PORT, () => {
  console.log(`✅ サーバー起動: http://localhost:${PORT}`);
  console.log(`   ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? '設定済み ✓' : '⚠️  未設定 — export ANTHROPIC_API_KEY="sk-ant-..." を実行してください'}`);
});
