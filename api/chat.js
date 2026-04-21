/**
 * api/chat.js
 * Vercel サーバーレス関数：Claude API チャット中継
 * ANTHROPIC_API_KEY は Vercel の環境変数に設定してください。
 */

import Anthropic from '@anthropic-ai/sdk';

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
// サーバーレス関数ハンドラー
// ===================================================
export default async function handler(req, res) {
  // POSTのみ受け付ける
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body;

  // 入力チェック
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messagesが不正です' });
  }

  // SSE（Server-Sent Events）ヘッダーを設定
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  // Claude クライアント初期化
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  try {
    // Claude API をストリーミングで呼び出す
    const stream = anthropic.messages.stream({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages,
    });

    // テキストデルタをリアルタイムでクライアントに送信
    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();

  } catch (err) {
    console.error('Claude API エラー:', err);
    const errorMsg = err.status === 401
      ? 'APIキーが正しく設定されていません。'
      : `エラーが発生しました: ${err.message}`;

    res.write(`data: ${JSON.stringify({ error: errorMsg })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
}

// Vercel の関数タイムアウトを延長（最大60秒）
export const config = {
  maxDuration: 60,
};
