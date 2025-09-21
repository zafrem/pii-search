import { LanguagePatterns, PIIType } from '../../backend/src/types';

export const chinesePatterns: LanguagePatterns = {
  language: 'chinese',
  patterns: [
    {
      type: 'phone' as PIIType,
      pattern: '1[3-9]\\d{9}',
      flags: 'g',
      description: 'Chinese mobile phone numbers',
      examples: ['13812345678', '18987654321', '15611223344']
    },
    {
      type: 'phone' as PIIType,
      pattern: '0\\d{2,3}-?\\d{7,8}',
      flags: 'g',
      description: 'Chinese landline numbers',
      examples: ['010-12345678', '021-87654321', '075512345678']
    },
    {
      type: 'id_number' as PIIType,
      pattern: '\\d{17}[\\dxX]',
      flags: 'g',
      description: 'Chinese ID card numbers (18 digits)',
      examples: ['11010519491231002X', '440524188001010014']
    },
    {
      type: 'name' as PIIType,
      pattern: '[\\u4e00-\\u9fff]{2,4}(?=先生|女士|同志|老师|教授|经理|总监|主任)',
      flags: 'g',
      description: 'Chinese names with titles',
      examples: ['张三先生', '李四女士', '王五老师']
    },
    {
      type: 'name' as PIIType,
      pattern: '(?<=姓名[：:\\s]*)[\\u4e00-\\u9fff]{2,4}',
      flags: 'g',
      description: 'Chinese names after 姓名 label',
      examples: ['姓名：张三', '姓名 李四']
    },
    {
      type: 'address' as PIIType,
      pattern: '[\\u4e00-\\u9fff]+[省市区][\\u4e00-\\u9fff]*[市区县][\\u4e00-\\u9fff]*[街道路巷弄]\\d*号?',
      flags: 'g',
      description: 'Chinese addresses',
      examples: ['北京市朝阳区建国路88号', '上海市浦东新区陆家嘴环路1000号']
    },
    {
      type: 'postal_code' as PIIType,
      pattern: '\\d{6}',
      flags: 'g',
      description: 'Chinese postal codes',
      examples: ['100000', '200000', '518000']
    },
    {
      type: 'email' as PIIType,
      pattern: '[a-zA-Z0-9\\u4e00-\\u9fff._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
      flags: 'gi',
      description: 'Email addresses (including Chinese characters)',
      examples: ['张三@163.com', 'user@qq.com', '李四@company.com.cn']
    },
    {
      type: 'organization' as PIIType,
      pattern: '[\\u4e00-\\u9fff]+(?:公司|企业|集团|银行|学校|医院|政府|部门)',
      flags: 'g',
      description: 'Chinese organizations',
      examples: ['阿里巴巴集团', '中国银行', '清华大学']
    },
    {
      type: 'bank_account' as PIIType,
      pattern: '\\b\\d{16,19}\\b',
      flags: 'g',
      description: 'Chinese bank account numbers',
      examples: ['6225887712345678', '1234567890123456789']
    },
    {
      type: 'national_id' as PIIType,
      pattern: '\\d{17}[\\dxX]',
      flags: 'g',
      description: 'Chinese national ID card (身份证)',
      examples: ['11010519491231002X', '440524188001010014']
    },
    {
      type: 'passport' as PIIType,
      pattern: '[EG]\\d{8}',
      flags: 'g',
      description: 'Chinese passport numbers',
      examples: ['E12345678', 'G87654321']
    },
    {
      type: 'coordinates' as PIIType,
      pattern: '(?:纬度|lat|latitude)[:=]?\\s*[123]\\d\\.\\d+[°]?[\\s,]*(?:经度|lng|longitude)[:=]?\\s*1[01]\\d\\.\\d+[°]?',
      flags: 'gi',
      description: 'Chinese geographic coordinates',
      examples: ['纬度: 39.9042, 经度: 116.4074', 'lat 31.2304, lng 121.4737']
    },
    {
      type: 'date_of_birth' as PIIType,
      pattern: '(?:出生日期|生日)[:=]?\\s*\\d{4}[年/-]\\d{1,2}[月/-]\\d{1,2}[日]?',
      flags: 'gi',
      description: 'Chinese date of birth',
      examples: ['出生日期: 1990年3月15日', '生日 1985-12-25']
    },
    {
      type: 'tax_id' as PIIType,
      pattern: '[91]\\d{17}',
      flags: 'g',
      description: 'Chinese unified social credit code (统一社会信用代码)',
      examples: ['91110000100000001A', '914403001234567890']
    },
    {
      type: 'swift_code' as PIIType,
      pattern: '[A-Z]{4}CN[A-Z0-9]{2}(?:[A-Z0-9]{3})?',
      flags: 'g',
      description: 'Chinese bank SWIFT codes',
      examples: ['ICBKCNBJ', 'BKCHCNBJ300']
    },
    {
      type: 'iban' as PIIType,
      pattern: 'CN\\d{2}\\s?\\d{4}\\s?\\d{4}\\s?\\d{4}\\s?\\d{4}\\s?\\d{4}\\s?\\d{3}',
      flags: 'gi',
      description: 'Chinese IBAN (if applicable)',
      examples: ['CN89 3704 0044 0532 0130 0000 123']
    }
  ],
  contextRules: [
    {
      type: 'name' as PIIType,
      beforePatterns: ['姓名', '名字', '联系人', '负责人'],
      afterPatterns: ['先生', '女士', '同志', '老师'],
      negativePatterns: ['公司名', '企业名', '单位名'],
      weight: 0.8
    },
    {
      type: 'phone' as PIIType,
      beforePatterns: ['电话', '手机', '联系方式', '联系电话'],
      afterPatterns: [],
      negativePatterns: ['传真'],
      weight: 0.9
    },
    {
      type: 'id_number' as PIIType,
      beforePatterns: ['身份证', '身份证号', '证件号'],
      afterPatterns: [],
      negativePatterns: [],
      weight: 0.95
    }
  ]
};