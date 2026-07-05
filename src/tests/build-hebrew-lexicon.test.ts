import { describe, it, expect } from 'vitest';
import { 
  normalizeUsageTags, 
  cleanText, 
  extractBdbShort 
} from '../../scripts/build-hebrew-lexicon';

describe('build-hebrew-lexicon pipeline functions', () => {
  describe('normalizeUsageTags', () => {
    it('should split tags by commas and semicolons', () => {
      const input = 'chief, father; patrimony, principal';
      const result = normalizeUsageTags(input);
      expect(result).toEqual(['chief', 'father', 'patrimony', 'principal']);
    });

    it('should remove noise such as ×, symbols, and parenthesis', () => {
      const input = 'chief, (fore-) father(-less), × patrimony';
      const result = normalizeUsageTags(input);
      expect(result).toEqual(['chief', 'father', 'patrimony']);
    });

    it('should truncate compare/see notes', () => {
      const input = 'father. Compare names in Abi-';
      const result = normalizeUsageTags(input);
      expect(result).toEqual(['father']);
    });

    it('should discard long tags (> 40 chars)', () => {
      const input = 'short tag, a very very very very very very long tag that exceeds forty characters';
      const result = normalizeUsageTags(input);
      expect(result).toEqual(['short tag']);
    });

    it('should limit to maximum 8 tags', () => {
      const input = 'one, two, three, four, five, six, seven, eight, nine, ten';
      const result = normalizeUsageTags(input);
      expect(result.length).toBe(8);
      expect(result).toEqual(['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight']);
    });
  });

  describe('cleanText', () => {
    it('should strip xml tags and special symbols', () => {
      const input = '<def>father</def>, in a † literal and √ immediate sense';
      const result = cleanText(input);
      expect(result).toBe('father, in a literal and immediate sense');
    });

    it('should collapse multiple spaces', () => {
      const input = 'word   with   too   many    spaces';
      const result = cleanText(input);
      expect(result).toBe('word with too many spaces');
    });
  });

  describe('extractBdbShort', () => {
    it('should extract first sense block from bdb entry', () => {
      const entry = `
        <entry id="a.ac.aa">
          <w>āḇ</w>
          <sense n="1"><def>father</def> in literal sense</sense>
          <sense n="2"><def>ancestor</def> in broader sense</sense>
        </entry>
      `;
      const result = extractBdbShort(entry);
      expect(result).toBe('father in literal sense');
    });

    it('should fall back to cleaned entry text if no sense matches', () => {
      const entry = '<entry id="a.ac.ab"><def>destruction</def> of ruins</entry>';
      const result = extractBdbShort(entry);
      expect(result).toBe('destruction of ruins');
    });

    it('should truncate text to max 400 chars and add ellipsis', () => {
      const longText = 'a '.repeat(250); // 500 characters
      const entry = `<entry id="test"><sense n="1">${longText}</sense></entry>`;
      const result = extractBdbShort(entry);
      expect(result!.length).toBeLessThanOrEqual(400);
      expect(result!.endsWith('…')).toBe(true);
    });
  });
});
