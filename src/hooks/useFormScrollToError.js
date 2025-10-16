import { useRef } from 'react'
import { Controller } from 'react-hook-form'

/**
 * Enhanced custom hook for handling form field refs and auto-scrolling to errors
 * @param {string[]} fieldNames - Array of field names in priority order (auto-generated from defaultValues)
 * @returns {object} - { getFieldRef, scrollToFirstError, RefController }
 */
export const useFormScrollToError = (fieldNames = []) => {
  const fieldRefs = useRef({})

  // Helper function to get or create ref for a field
  const getFieldRef = fieldName => {
    if (!fieldRefs.current[fieldName]) {
      fieldRefs.current[fieldName] = { current: null }
    }
    
return fieldRefs.current[fieldName]
  }

  // Smart error handler that scrolls to first error field
  const scrollToFirstError = errors => {
    // Get actual error field names (only fields that have validation errors)
    const actualErrorFields = Object.keys(errors || {})
    if (actualErrorFields.length === 0) return

    // Find first field with actual error based on priority order
    for (const fieldName of fieldNames) {
      // Only scroll if field has actual validation error
      if (actualErrorFields.includes(fieldName) && errors[fieldName]) {
        const fieldRef = fieldRefs.current[fieldName]
        if (fieldRef?.current) {
          fieldRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          })

          break
        }
      }
    }
  }

  // Smart onError function that only handles actual validation errors
  const createOnError =
    (specialCases = {}) =>
    errors => {
      console.log('Validation errors:', errors) // Debug actual errors

      // Only handle special cases if they actually have validation errors
      for (const [errorKey, ref] of Object.entries(specialCases)) {
        if (errors[errorKey] && ref?.current) {
          ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
          
return
        }
      }

      // Handle regular fields that have validation errors
      scrollToFirstError(errors)
    }

  // Enhanced Controller wrapper that automatically handles refs
  const RefController = ({ name, children, ...props }) => {
    const fieldRef = getFieldRef(name)

    // Clone children and add ref automatically
    const enhancedChildren =
      typeof children === 'function'
        ? fieldProps => {
            const element = children(fieldProps)

            return element
              ? {
                  ...element,
                  props: {
                    ...element.props,
                    ref: fieldRef
                  }
                }
              : element
          }
        : children

    return (
      <Controller name={name} {...props}>
        {enhancedChildren}
      </Controller>
    )
  }

  return {
    getFieldRef,
    scrollToFirstError,
    createOnError,
    RefController // New enhanced Controller
  }
}
