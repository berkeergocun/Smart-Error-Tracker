import OpenAI from 'openai';

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export interface AIAnalysisResult {
  summary: string;
  possibleCauses: string[];
  suggestions: string[];
  analyzedAt: Date;
}

interface ErrorContext {
  message: string;
  type?: string;
  stack?: string;
  source?: string;
  url?: string;
  lineno?: number;
  colno?: number;
  count?: number;
  userAgent?: string;
}

export async function analyzeError(error: ErrorContext): Promise<AIAnalysisResult> {
  if (!openai) {
    return generateFallbackAnalysis(error);
  }

  const prompt = buildPrompt(error);

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Sen bir uzman yazılım geliştirici ve hata analiz sistemissin. 
          JavaScript/TypeScript, Node.js, tarayıcı hataları ve web API hatalarında uzmansın.
          Verilen hata bilgilerini Türkçe olarak analiz et ve olası nedenleri ile çözüm önerilerini sun.
          Her zaman yapıcı ve açıklayıcı ol.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('Empty AI response');

    const parsed = JSON.parse(content);
    return {
      summary: parsed.summary || 'Analiz tamamlanamadı',
      possibleCauses: Array.isArray(parsed.possibleCauses) ? parsed.possibleCauses : [],
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
      analyzedAt: new Date(),
    };
  } catch (err) {
    console.error('AI analysis failed, using fallback:', err);
    return generateFallbackAnalysis(error);
  }
}

function buildPrompt(error: ErrorContext): string {
  return `Aşağıdaki JavaScript/web hatasını analiz et:

**Hata Mesajı:** ${error.message}
**Hata Tipi:** ${error.type || 'unknown'}
${error.source ? `**Kaynak Dosya:** ${error.source}` : ''}
${error.lineno ? `**Satır:** ${error.lineno}${error.colno ? `, Sütun: ${error.colno}` : ''}` : ''}
${error.url ? `**URL:** ${error.url}` : ''}
${error.count ? `**Oluşma Sayısı:** ${error.count} kez` : ''}
${error.userAgent ? `**Tarayıcı:** ${error.userAgent.slice(0, 100)}` : ''}
${
  error.stack
    ? `**Stack Trace:**
\`\`\`
${error.stack.slice(0, 1500)}
\`\`\``
    : ''
}

Lütfen şu formatta JSON döndür:
{
  "summary": "Hatanın kısa ve net açıklaması (1-2 cümle)",
  "possibleCauses": [
    "Olası neden 1",
    "Olası neden 2",
    "Olası neden 3"
  ],
  "suggestions": [
    "Çözüm önerisi 1",
    "Çözüm önerisi 2",
    "Çözüm önerisi 3"
  ]
}`;
}

function generateFallbackAnalysis(error: ErrorContext): AIAnalysisResult {
  const { message, type = 'javascript' } = error;

  // Bilinen hata kalıplarına göre basit analiz
  const patterns: Record<string, { causes: string[]; suggestions: string[] }> = {
    'cannot read': {
      causes: [
        'Null veya undefined bir değer üzerinde property erişimi yapılmaya çalışılıyor',
        'Asenkron işlem tamamlanmadan önce değere erişilmesi',
        'Yanlış veri yapısı beklentisi',
      ],
      suggestions: [
        'Değişkene erişmeden önce null/undefined kontrolü yapın',
        'Optional chaining (?.) kullanmayı deneyin',
        'Asenkron işlemlerin await ile tamamlandığından emin olun',
      ],
    },
    'typeerror': {
      causes: [
        'Yanlış veri tipi kullanımı',
        'Fonksiyon olmayan bir değeri çağırma girişimi',
        'Tip dönüşüm hatası',
      ],
      suggestions: [
        'TypeScript ile tip güvenliğini artırın',
        'Girdi validasyonu ekleyin',
        'typeof kontrolü yapın',
      ],
    },
    'referenceerror': {
      causes: [
        'Tanımlanmamış bir değişkene erişim',
        'Import/require eksikliği',
        'Scope dışı değişken erişimi',
      ],
      suggestions: [
        'Değişkenin doğru scope\'da tanımlandığını kontrol edin',
        'Gerekli import ifadelerini ekleyin',
        'Değişken adını kontrol edin (yazım hatası olabilir)',
      ],
    },
    'network': {
      causes: [
        'Sunucu bağlantı sorunu',
        'CORS politikası ihlali',
        'Ağ zaman aşımı',
      ],
      suggestions: [
        'Sunucu durumunu kontrol edin',
        'CORS ayarlarını gözden geçirin',
        'Retry mekanizması ekleyin',
      ],
    },
    default: {
      causes: [
        'Beklenmeyen uygulama durumu',
        'Çevre değişkeni veya konfigürasyon sorunu',
        'Kütüphane uyumsuzluğu',
      ],
      suggestions: [
        'Hata stack trace\'ini detaylı inceleyin',
        'Bağımlılıkların güncel olduğunu kontrol edin',
        'Benzer hata raporlarını araştırın',
      ],
    },
  };

  const lowerMessage = message.toLowerCase();
  let analysis = patterns.default;

  for (const [key, value] of Object.entries(patterns)) {
    if (key !== 'default' && lowerMessage.includes(key)) {
      analysis = value;
      break;
    }
  }

  return {
    summary: `${type} hatası: "${message.slice(0, 100)}". Bu hata uygulama genelinde ${error.count || 1} kez oluştu.`,
    possibleCauses: analysis.causes,
    suggestions: analysis.suggestions,
    analyzedAt: new Date(),
  };
}
