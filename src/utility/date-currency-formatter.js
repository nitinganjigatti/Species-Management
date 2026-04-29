import i18n from 'src/configs/i18n'
import { getLanguageConfig } from './localeConfig'

/**
 * Format a date string using the current i18n locale.
 * Safe to use outside React components (does not use hooks).
 *
 * @param {string|Date} dateString - Date to format
 * @param {'short'|'long'|'datetime'} dateType - Format type
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString, dateType = 'short') => {
  const lng = i18n.language
  const date = dateString instanceof Date ? dateString : new Date(dateString)

  const options = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...(dateType === 'long' && { month: 'short', day: 'numeric' }),
    ...(dateType === 'datetime' && { hour: '2-digit', minute: '2-digit' })
  }

  return new Intl.DateTimeFormat(lng, options).format(date)
}

/**
 * Format a number as currency using the current i18n locale.
 * Safe to use outside React components (does not use hooks).
 *
 * @param {number} value - Amount to format
 * @param {Object} options - { currency, minDigits, maxDigits }
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (value, options = {}) => {
  const lng = i18n.language
  const config = getLanguageConfig(lng)

  return new Intl.NumberFormat(lng, {
    style: 'currency',
    currency: options.currency || config.currency,
    minimumFractionDigits: options.minDigits ?? 2,
    maximumFractionDigits: options.maxDigits ?? 2
  }).format(value)
}

/**
 * Format a number using the current i18n locale.
 *
 * @param {number} value - Number to format
 * @returns {string} Formatted number string
 */
export const formatNumber = value => {
  return new Intl.NumberFormat(i18n.language).format(value)
}
