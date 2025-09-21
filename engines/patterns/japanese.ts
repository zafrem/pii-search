import { LanguagePatterns, PIIType } from '../../backend/src/types';

export const japanesePatterns: LanguagePatterns = {
  language: 'japanese',
  patterns: [
    {
      type: 'phone' as PIIType,
      pattern: '0\\d{1,4}-?\\d{2,4}-?\\d{4}',
      flags: 'g',
      description: 'Japanese phone numbers',
      examples: ['03-1234-5678', '090-1234-5678', '0312345678']
    },
    {
      type: 'postal_code' as PIIType,
      pattern: '〒?\\d{3}-?\\d{4}',
      flags: 'g',
      description: 'Japanese postal codes',
      examples: ['〒123-4567', '123-4567', '1234567']
    },
    {
      type: 'name' as PIIType,
      pattern: '[\\u3040-\\u309f\\u30a0-\\u30ff\\u4e00-\\u9fff]{2,4}(?=さん|様|君|ちゃん|先生|教授|部長|課長)',
      flags: 'g',
      description: 'Japanese names with honorifics',
      examples: ['田中さん', '佐藤様', '山田先生']
    },
    {
      type: 'name' as PIIType,
      pattern: '(?<=名前[：:\\s]*)[\\u3040-\\u309f\\u30a0-\\u30ff\\u4e00-\\u9fff]{2,6}',
      flags: 'g',
      description: 'Japanese names after 名前 label',
      examples: ['名前：田中太郎', '名前 山田花子']
    },
    {
      type: 'address' as PIIType,
      pattern: '[\\u4e00-\\u9fff]+[都道府県][\\u4e00-\\u9fff]*[市区町村][\\u4e00-\\u9fff]*[丁目番地号]?\\d*-?\\d*',
      flags: 'g',
      description: 'Japanese addresses',
      examples: ['東京都渋谷区代々木1-2-3', '大阪府大阪市中央区難波']
    },
    {
      type: 'email' as PIIType,
      pattern: '[a-zA-Z0-9\\u3040-\\u309f\\u30a0-\\u30ff\\u4e00-\\u9fff._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
      flags: 'gi',
      description: 'Email addresses (including Japanese characters)',
      examples: ['田中@example.com', 'user@yahoo.co.jp', 'test@company.jp']
    },
    {
      type: 'organization' as PIIType,
      pattern: '[\\u4e00-\\u9fff\\u3040-\\u309f\\u30a0-\\u30ff]+(?:株式会社|有限会社|合同会社|会社|銀行|大学|学校|病院)',
      flags: 'g',
      description: 'Japanese organizations',
      examples: ['トヨタ自動車株式会社', '東京大学', '三菱UFJ銀行']
    },
    {
      type: 'date' as PIIType,
      pattern: '(?:令和|平成|昭和)\\d{1,2}年\\d{1,2}月\\d{1,2}日',
      flags: 'g',
      description: 'Japanese era dates',
      examples: ['令和5年12月25日', '平成30年1月1日']
    },
    {
      type: 'date' as PIIType,
      pattern: '\\d{4}年\\d{1,2}月\\d{1,2}日',
      flags: 'g',
      description: 'Japanese dates (Western calendar)',
      examples: ['2023年12月25日', '2024年1月1日']
    },
    {
      type: 'bank_account' as PIIType,
      pattern: '\\b\\d{7,8}\\b',
      flags: 'g',
      description: 'Japanese bank account numbers',
      examples: ['1234567', '12345678']
    },
    {
      type: 'national_id' as PIIType,
      pattern: '\\b\\d{12}\\b',
      flags: 'g',
      description: 'Japanese My Number (マイナンバー)',
      examples: ['123456789012', '987654321098']
    },
    {
      type: 'passport' as PIIType,
      pattern: '[A-Z]{2}\\d{7}',
      flags: 'g',
      description: 'Japanese passport numbers',
      examples: ['AB1234567', 'XY9876543']
    },
    {
      type: 'coordinates' as PIIType,
      pattern: '(?:緯度|lat|latitude)[:=]?\\s*[34]\\d\\.\\d+[°]?[\\s,]*(?:経度|lng|longitude)[:=]?\\s*1[23]\\d\\.\\d+[°]?',
      flags: 'gi',
      description: 'Japanese geographic coordinates',
      examples: ['緯度: 35.6762, 経度: 139.6503', 'lat 34.6937, lng 135.5022']
    },
    {
      type: 'date_of_birth' as PIIType,
      pattern: '(?:生年月日|誕生日)[:=]?\\s*\\d{4}[年/-]\\d{1,2}[月/-]\\d{1,2}[日]?',
      flags: 'gi',
      description: 'Japanese date of birth',
      examples: ['生年月日: 1990年3月15日', '誕生日 1985-12-25']
    },
    {
      type: 'tax_id' as PIIType,
      pattern: 'T\\d{13}',
      flags: 'g',
      description: 'Japanese corporate tax number (法人番号)',
      examples: ['T1234567890123', 'T9876543210987']
    },
    {
      type: 'swift_code' as PIIType,
      pattern: '[A-Z]{4}JP[A-Z0-9]{2}(?:[A-Z0-9]{3})?',
      flags: 'g',
      description: 'Japanese bank SWIFT codes',
      examples: ['BOTKJPJT', 'MUFGJPJT001']
    }
  ],
  contextRules: [
    {
      type: 'name' as PIIType,
      beforePatterns: ['名前', '氏名', '担当者', '連絡先'],
      afterPatterns: ['さん', '様', '君', '先生'],
      negativePatterns: ['会社名', '企業名'],
      weight: 0.8
    },
    {
      type: 'phone' as PIIType,
      beforePatterns: ['電話', '電話番号', 'TEL', '携帯'],
      afterPatterns: [],
      negativePatterns: ['FAX', 'ファックス'],
      weight: 0.9
    }
  ]
};