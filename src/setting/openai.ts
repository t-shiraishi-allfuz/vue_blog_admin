// 設定の型を定義
export interface OpenAIConfig {
	apiKey: string;
	model: string;
	temperature: number;
	max_tokens: number;
	systemMessage: string;
}

export const openAIConfig: OpenAIConfig = {
	apiKey: import.meta.env.VITE_OPENAI_API_KEY || '', 
	model: 'gpt-4.1-mini',      // または 'gpt-4' など
	temperature: 0.7,          // 創造性の度合い (0〜2)
	max_tokens: 500,           // 応答の最大長
	systemMessage: 'あなたはトーク機能のテスト用AIです'
};
