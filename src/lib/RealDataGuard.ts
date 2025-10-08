/**
 * RealDataGuard - Utility to enforce real data usage in AI workflows
 * and provide fallbacks for mock-like inputs
 */

export interface RealDataSource {
  name: string;
  url: string;
  description: string;
  format: 'json' | 'csv' | 'image' | 'text';
}

export const REAL_DATA_SOURCES: Record<string, RealDataSource> = {
  covid_data: {
    name: 'COVID-19 Global Data',
    url: 'https://disease.sh/v3/covid-19/countries',
    description: 'Real-time COVID-19 statistics by country',
    format: 'json'
  },
  sample_image: {
    name: 'Gutenberg Book Cover',
    url: 'https://www.gutenberg.org/files/74/74-h/images/cover.jpg',
    description: 'Real book cover image for OCR testing',
    format: 'image'
  },
  financial_data: {
    name: 'Financial Market Data',
    url: 'https://api.exchangerate-api.com/v4/latest/USD',
    description: 'Current exchange rates',
    format: 'json'
  },
  news_data: {
    name: 'News Headlines',
    url: 'https://jsonplaceholder.typicode.com/posts',
    description: 'Sample news-like content for analysis',
    format: 'json'
  }
};

export class RealDataGuard {
  private static MOCK_PATTERNS = [
    /lorem\s+ipsum/i,
    /test\s*(data|input|content)/i,
    /mock\s*(data|input|content)/i,
    /sample\s*(data|input|content)/i,
    /placeholder/i,
    /dummy\s*(data|input|content)/i,
    /fake\s*(data|input|content)/i,
    /example\s*(data|input|content)/i
  ];

  /**
   * Check if input appears to be mock/test data
   */
  static isMockData(input: string): boolean {
    return this.MOCK_PATTERNS.some(pattern => pattern.test(input));
  }

  /**
   * Get a real data source for the given type
   */
  static getRealDataSource(type: keyof typeof REAL_DATA_SOURCES): RealDataSource {
    return REAL_DATA_SOURCES[type];
  }

  /**
   * Fetch real data from a source
   */
  static async fetchRealData(sourceKey: keyof typeof REAL_DATA_SOURCES): Promise<any> {
    const source = this.getRealDataSource(sourceKey);
    
    try {
      const response = await fetch(source.url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ${source.name}: ${response.statusText}`);
      }

      if (source.format === 'json') {
        return await response.json();
      } else if (source.format === 'image') {
        return {
          url: source.url,
          blob: await response.blob(),
          type: 'image'
        };
      } else {
        return await response.text();
      }
    } catch (error) {
      console.error(`Error fetching real data from ${source.name}:`, error);
      throw new Error(`Unable to fetch real data from ${source.name}`);
    }
  }

  /**
   * Validate input and provide real data fallback if needed
   */
  static async validateOrProvideRealData(
    input: string, 
    fallbackType: keyof typeof REAL_DATA_SOURCES
  ): Promise<{ data: any; wasReplaced: boolean; source?: string }> {
    
    if (this.isMockData(input)) {
      console.warn(`Mock data detected: "${input.substring(0, 50)}..." - Using real data fallback`);
      
      try {
        const realData = await this.fetchRealData(fallbackType);
        const source = this.getRealDataSource(fallbackType);
        
        return {
          data: realData,
          wasReplaced: true,
          source: source.name
        };
      } catch (error) {
        throw new Error(`Mock data rejected and real data fallback failed: ${error}`);
      }
    }

    return {
      data: input,
      wasReplaced: false
    };
  }

  /**
   * Get available real data sources
   */
  static getAvailableSources(): RealDataSource[] {
    return Object.values(REAL_DATA_SOURCES);
  }

  /**
   * Create a user-friendly message about data requirements
   */
  static createDataRequirementMessage(rejectedInput: string): string {
    const sources = this.getAvailableSources();
    const sourceList = sources.map(s => `• ${s.name}: ${s.description}`).join('\n');
    
    return `
Mock data detected and rejected: "${rejectedInput.substring(0, 50)}..."

Please provide real data or choose from these available sources:
${sourceList}

Real data ensures accurate AI processing and meaningful results.
    `.trim();
  }
}

export default RealDataGuard;