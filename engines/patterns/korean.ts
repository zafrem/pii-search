import { LanguagePatterns, PIIType } from '../../backend/src/types';

export const koreanPatterns: LanguagePatterns = {
  language: 'korean',
  patterns: [
    {
      type: 'phone' as PIIType,
      pattern: '01[016789]-?\\d{3,4}-?\\d{4}',
      flags: 'g',
      description: 'Korean mobile phone numbers',
      examples: ['010-1234-5678', '011-123-4567', '01012345678']
    },
    {
      type: 'phone' as PIIType,
      pattern: '0\\d{1,2}-?\\d{3,4}-?\\d{4}',
      flags: 'g',
      description: 'Korean landline numbers',
      examples: ['02-1234-5678', '031-123-4567', '0212345678']
    },
    {
      type: 'name' as PIIType,
      pattern: '[가-힣]{2,4}(?=님|씨|과장|부장|대리|차장|팀장|실장|이사|대표|회장)',
      flags: 'g',
      description: 'Korean names with titles',
      examples: ['김철수님', '이영희씨', '박영수과장']
    },
    {
      type: 'name' as PIIType,
      pattern: '(?<=성명[:\\s]*)[가-힣]{2,4}',
      flags: 'g',
      description: 'Korean names after 성명 label',
      examples: ['성명: 김철수', '성명 이영희']
    },
    {
      type: 'address' as PIIType,
      pattern: '[가-힣]+[시도][\\s]*[가-힣]+[시군구][\\s]*[가-힣]+[동읍면][\\s]*\\d+(?:-\\d+)*',
      flags: 'g',
      description: 'Korean addresses with administrative divisions',
      examples: ['서울특별시 강남구 역삼동 123-45', '부산광역시 해운대구 우동 678']
    },
    {
      type: 'postal_code' as PIIType,
      pattern: '\\d{5}',
      flags: 'g',
      description: 'Korean postal codes',
      examples: ['12345', '06234']
    },
    {
      type: 'id_number' as PIIType,
      pattern: '\\d{6}-?[1-4]\\d{6}',
      flags: 'g',
      description: 'Korean resident registration numbers',
      examples: ['123456-1234567', '9876541234567']
    },
    {
      type: 'email' as PIIType,
      pattern: '[a-zA-Z0-9가-힣._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
      flags: 'gi',
      description: 'Email addresses (including Korean characters)',
      examples: ['김철수@naver.com', 'user@gmail.com', '홍길동@company.co.kr']
    },
    {
      type: 'bank_account' as PIIType,
      pattern: '\\b\\d{10,16}\\b',
      flags: 'g',
      description: 'Korean bank account numbers',
      examples: ['1234567890123', '123456789012345']
    },
    {
      type: 'national_id' as PIIType,
      pattern: '\\d{6}-?[1-4]\\d{6}',
      flags: 'g',
      description: 'Korean resident registration number (주민등록번호)',
      examples: ['123456-1234567', '9876541234567']
    },
    {
      type: 'passport' as PIIType,
      pattern: '[MPST]\\d{8}',
      flags: 'g',
      description: 'Korean passport numbers',
      examples: ['M12345678', 'P87654321']
    },
    {
      type: 'coordinates' as PIIType,
      pattern: '(?:위도|lat|latitude)[:=]?\\s*\\d{2}\\.\\d+[°]?[\\s,]*(?:경도|lng|longitude)[:=]?\\s*1[23]\\d\\.\\d+[°]?',
      flags: 'gi',
      description: 'Korean geographic coordinates',
      examples: ['위도: 37.5665, 경도: 126.9780', 'lat 35.1796, lng 129.0756']
    },
    {
      type: 'date_of_birth' as PIIType,
      pattern: '(?:생년월일|출생일|생일)[:=]?\\s*\\d{4}[./-]\\d{1,2}[./-]\\d{1,2}',
      flags: 'gi',
      description: 'Korean date of birth',
      examples: ['생년월일: 1990.03.15', '출생일 1985-12-25']
    },
    {
      type: 'tax_id' as PIIType,
      pattern: '\\d{3}-\\d{2}-\\d{5}',
      flags: 'g',
      description: 'Korean business registration number (사업자등록번호)',
      examples: ['123-45-67890', '987-65-43210']
    }
  ],
  contextRules: [
    {
      type: 'name' as PIIType,
      beforePatterns: ['성명', '이름', '성함', '담당자', '연락처'],
      afterPatterns: ['님', '씨', '선생', '대표'],
      negativePatterns: ['회사명', '상호', '업체명'],
      weight: 0.8
    },
    {
      type: 'phone' as PIIType,
      beforePatterns: ['전화', '연락처', '휴대폰', '핸드폰', 'TEL', 'HP'],
      afterPatterns: [],
      negativePatterns: ['팩스', 'FAX'],
      weight: 0.9
    }
  ]
};