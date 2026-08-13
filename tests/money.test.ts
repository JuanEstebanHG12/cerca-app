import { describe, it, expect } from 'vitest';
import { formatMoney, formatDistance, minorUnitDigits } from '../src/domain/money';

describe('minorUnitDigits', () => {
  it('JPY tiene 0 decimales', () => expect(minorUnitDigits('JPY')).toBe(0));
  it('KWD tiene 3 decimales', () => expect(minorUnitDigits('KWD')).toBe(3));
  it('MXN tiene 2 decimales', () => expect(minorUnitDigits('MXN')).toBe(2));
  it('USD tiene 2 decimales', () => expect(minorUnitDigits('USD')).toBe(2));
});

describe('formatMoney — MXN $1,299.90', () => {
  const mxn = { amountMinor: 129990, currency: 'MXN' as const };

  it('en es-MX muestra formato peso mexicano', () => {
    const result = formatMoney(mxn, 'es-MX');
    expect(result).toMatch('1,299.90');
    expect(result).toMatch('MXN');
  });

  it('en en-US muestra formato con símbolo MX$', () => {
    const result = formatMoney(mxn, 'en-US');
    expect(result).toMatch('1,299.90');
  });

  it('en de-DE usa punto como separador de miles y coma para decimales', () => {
    const result = formatMoney(mxn, 'de-DE');
    expect(result).toMatch('1.299,90');
  });
});

describe('formatMoney — JPY sin decimales', () => {
  const jpy = { amountMinor: 1500, currency: 'JPY' as const };

  it('JPY no tiene decimales', () => {
    const result = formatMoney(jpy, 'ja-JP');
    expect(result).not.toMatch('.');
    expect(result).toMatch('1,500');
  });
});

describe('formatDistance', () => {
  it('devuelve km para locale es-MX', () => {
    const result = formatDistance(5, 'es-MX');
    expect(result).toBe('5 km');
  });

  it('devuelve millas para locale en-US', () => {
    const result = formatDistance(5, 'en-US');
    expect(result).toMatch('mi');
    expect(result).toMatch('3.1');
  });

  it('devuelve km para locale de-DE (no imperial)', () => {
    const result = formatDistance(10, 'de-DE');
    expect(result).toMatch('km');
  });
});
