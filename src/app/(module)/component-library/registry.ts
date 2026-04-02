export interface ComponentProp {
  name: string
  type: string
  default?: string
  description: string
  required?: boolean
  control?: 'text' | 'boolean' | 'select' | 'color'
  options?: string[]
}

export interface PreviewConfig {
  /** Default prop values for the preview demo */
  defaults: Record<string, any>
  /** Preview type hint for the renderer */
  type: 'dialog' | 'drawer' | 'input' | 'button' | 'notification' | 'card' | 'media' | 'tabs' | 'table' | 'generic'
}

export interface ComponentEntry {
  name: string
  slug: string
  description: string
  category: string
  path: string
  props: ComponentProp[]
  relatedComponents?: string[]
  preview?: PreviewConfig
}

export const CATEGORIES = [
  { key: 'all', label: 'All', color: 'primary', count: 0 },
  { key: 'dialog', label: 'Dialogs', count: 3, color: 'primary' },
  { key: 'drawer', label: 'Drawers', count: 3, color: 'secondary' },
  { key: 'date-picker', label: 'Date Pickers', count: 4, color: 'tertiary' },
  { key: 'form', label: 'Forms & Inputs', count: 17, color: 'primary' },
  { key: 'button', label: 'Buttons', count: 1, color: 'primary' },
  { key: 'media', label: 'Media', count: 2, color: 'secondary' },
  { key: 'table', label: 'Tables', count: 3, color: 'primary' },
  { key: 'navigation', label: 'Navigation', count: 1, color: 'secondary' },
  { key: 'notification', label: 'Notifications', count: 1, color: 'tertiary' },
  { key: 'display', label: 'Display', count: 2, color: 'primary' },
  { key: 'view', label: 'Views', count: 26, color: 'secondary' },
  { key: 'hook', label: 'Hooks', count: 4, color: 'tertiary' },
  { key: 'utility', label: 'Utils', count: 7, color: 'primary' },
  { key: 'context', label: 'Contexts', count: 5, color: 'secondary' }
] as const

export const COMPONENT_REGISTRY: ComponentEntry[] = [
  // Dialogs & Modals
  {
    name: 'ConfirmationDialog',
    slug: 'confirmation-dialog',
    description:
      'Full-featured confirmation dialog with icon/image, title, description, and action buttons with loading states. Prevents backdrop click dismiss.',
    category: 'dialog',
    path: 'src/components/confirmation-dialog/index.js',
    props: [
      { name: 'title', type: 'string', required: true, description: 'Dialog heading text', control: 'text' },
      { name: 'description', type: 'string', required: true, description: 'Body text below the title', control: 'text' },
      {
        name: 'dialogBoxStatus',
        type: 'boolean',
        required: true,
        description: 'Controls dialog open/close state',
        control: 'boolean'
      },
      {
        name: 'loading',
        type: 'boolean',
        default: 'false',
        description: 'Shows loading spinner on confirm button',
        control: 'boolean'
      },
      { name: 'icon', type: 'string', description: 'Iconify icon name displayed in header', control: 'text' },
      { name: 'iconColor', type: 'string', description: 'Icon color override', control: 'color' },
      { name: 'image', type: 'string', description: 'Image URL displayed in header (alternative to icon)' },
      { name: 'onClose', type: '() => void', default: '() => {}', description: 'Callback when dialog is closed' },
      { name: 'confirmAction', type: '() => void', default: '() => {}', description: 'Callback on confirm click' },
      {
        name: 'ConfirmationText',
        type: 'string',
        description: 'Text for the confirm button',
        control: 'text'
      },
      { name: 'cancelText', type: 'string', description: 'Text for the cancel button', control: 'text' },
      {
        name: 'allowCancel',
        type: 'boolean',
        default: 'true',
        description: 'Show or hide the cancel button',
        control: 'boolean'
      },
      { name: 'formComponent', type: 'ReactNode', description: 'Custom form content inside the dialog' },
      { name: 'additionalDescription', type: 'string', description: 'Extra description text below main description' },
      { name: 'imgHeight', type: 'string', default: "'70px'", description: 'Height of the header image/icon' },
      { name: 'imgWidth', type: 'string', default: "'70px'", description: 'Width of the header image/icon' }
    ],
    relatedComponents: ['confirm-dialog-box', 'common-dialog-box', 'confirmation-delete-dialog'],
    preview: {
      type: 'dialog',
      defaults: {
        title: 'Delete Animal?',
        description: 'This action cannot be undone. The animal record and all associated data will be permanently removed.',
        icon: 'mdi:delete-outline',
        iconColor: '#FF4D49',
        ConfirmationText: 'Delete',
        cancelText: 'Cancel',
        loading: false,
        allowCancel: true
      }
    }
  },
  {
    name: 'ConfirmDialogBox',
    slug: 'confirm-dialog-box',
    description: 'Generic dialog wrapper with title, content area, and custom dialog actions.',
    category: 'dialog',
    path: 'src/components/ConfirmDialogBox.js',
    props: [
      { name: 'title', type: 'string', description: 'Dialog title', control: 'text' },
      { name: 'children', type: 'ReactNode', description: 'Dialog body content' },
      { name: 'dialogActions', type: 'ReactNode', description: 'Custom action buttons' },
      { name: 'open', type: 'boolean', description: 'Controls open state', control: 'boolean' },
      { name: 'onClose', type: '() => void', description: 'Close callback' }
    ],
    relatedComponents: ['confirmation-dialog', 'common-dialog-box'],
    preview: {
      type: 'dialog',
      defaults: {
        title: 'Save Changes?',
        description: 'You have unsaved changes. Do you want to save before leaving?',
        open: true
      }
    }
  },
  {
    name: 'CommonDialogBox',
    slug: 'common-dialog-box',
    description:
      'Reusable dialog container with optional title, form components, loading indicator, and fade transition.',
    category: 'dialog',
    path: 'src/components/CommonDialogBox.js',
    props: [
      { name: 'title', type: 'string', description: 'Dialog title', control: 'text' },
      { name: 'open', type: 'boolean', description: 'Controls open state', control: 'boolean' },
      { name: 'onClose', type: '() => void', description: 'Close callback' },
      { name: 'formComponent', type: 'ReactNode', description: 'Form content to render' },
      {
        name: 'loading',
        type: 'boolean',
        default: 'false',
        description: 'Shows circular progress',
        control: 'boolean'
      }
    ],
    relatedComponents: ['confirmation-dialog', 'confirm-dialog-box'],
    preview: {
      type: 'dialog',
      defaults: {
        title: 'Add New Record',
        open: true,
        loading: false
      }
    }
  },

  // Drawers
  {
    name: 'CustomFilterDrawer',
    slug: 'custom-filter-drawer',
    description: 'Right-side drawer with title, searchable filter list with badges, selectable items, and Apply/Clear All footer buttons. Supports custom children content.',
    category: 'drawer',
    path: 'src/components/drawers/CustomFilterDrawer.js',
    props: [
      { name: 'open', type: 'boolean', required: true, description: 'Controls drawer visibility', control: 'boolean' },
      { name: 'onClose', type: '() => void', required: true, description: 'Close callback' },
      { name: 'title', type: 'string', default: "'Filter'", description: 'Drawer header title', control: 'text' },
      { name: 'onApply', type: '() => void', description: 'Apply button callback' },
      { name: 'onClearAll', type: '() => void', description: 'Clear All button callback' },
      { name: 'filterLists', type: 'Array<{label, key, options}>', default: '[]', description: 'Filter menu items — each has label, key, and options array' },
      { name: 'selectedOptions', type: 'object', description: 'Currently selected filter values keyed by filter key' },
      { name: 'children', type: 'ReactNode', description: 'Custom content below filter list' },
      { name: 'isSubmitting', type: 'boolean', description: 'Loading state for apply button' },
      { name: 'selectedItem', type: 'string | null', description: 'Currently selected filter category key' },
      { name: 'onSelectItem', type: '(key) => void', description: 'Filter category selection callback' },
      { name: 'zIndex', type: 'number', description: 'Custom z-index for the drawer' }
    ],
    relatedComponents: ['filter-drawer', 'common-drawer-box'],
    preview: { type: 'drawer', defaults: { title: 'Filter Animals' } }
  },
  {
    name: 'FilterDrawer',
    slug: 'filter-drawer',
    description: 'Alternative filter drawer with selectable menu list, scrollable children content, and Apply button footer.',
    category: 'drawer',
    path: 'src/components/FilterDrawer.js',
    props: [
      { name: 'open', type: 'boolean', required: true, description: 'Controls drawer visibility', control: 'boolean' },
      { name: 'onClose', type: '() => void', required: true, description: 'Close callback' },
      { name: 'selectedItem', type: 'string | null', description: 'Currently selected menu item key' },
      { name: 'onSelectItem', type: '(key) => void', description: 'Menu item selection callback' },
      { name: 'filterLists', type: 'Array<{label, key}>', description: 'Menu items for the left sidebar list' },
      { name: 'children', type: 'ReactNode', description: 'Scrollable content area (right side)' },
      { name: 'handleApplyFilter', type: '() => void', description: 'Apply filter button callback' }
    ],
    relatedComponents: ['custom-filter-drawer', 'common-drawer-box'],
    preview: {
      type: 'drawer',
      defaults: { open: true, title: 'Filters' }
    }
  },
  {
    name: 'CommonDrawerBox',
    slug: 'common-drawer-box',
    description: 'Right-side drawer with header image, title, stats row (stores, quantity, batches, value), and custom content component.',
    category: 'drawer',
    path: 'src/components/CommonDrawerBox.js',
    props: [
      { name: 'title', type: 'string', required: true, description: 'Drawer header title', control: 'text' },
      { name: 'drawerStatus', type: 'boolean', required: true, description: 'Controls drawer open/close state', control: 'boolean' },
      { name: 'close', type: '() => void', required: true, description: 'Close callback' },
      { name: 'contentComponent', type: 'ReactNode', description: 'Main body content' },
      { name: 'imageUrl', type: 'string', description: 'Header image URL' },
      { name: 'style', type: 'object', description: 'Custom drawer styles' },
      { name: 'width', type: 'string | number', description: 'Drawer width' },
      { name: 'totalStores', type: 'number', description: 'Stats: total stores count' },
      { name: 'totalQuantity', type: 'number', description: 'Stats: total quantity' },
      { name: 'totalBatches', type: 'number', description: 'Stats: total batches' },
      { name: 'totalValue', type: 'string', description: 'Stats: total value (formatted)' }
    ],
    relatedComponents: ['custom-filter-drawer', 'filter-drawer'],
    preview: {
      type: 'drawer',
      defaults: { open: true, title: 'Shipment Details' }
    }
  },

  // Date Pickers
  {
    name: 'CustomDateRangePicker',
    slug: 'custom-date-range-picker',
    description: 'Date range picker with dual calendar view, custom formatting, and optional future/single date modes. Uses react-datepicker with DatePickerWrapper styling.',
    category: 'date-picker',
    path: 'src/components/custom-date-picker/CustomDateRangePicker.js',
    props: [
      { name: 'label', type: 'string', default: "'Select Date Range'", description: 'Input label text', control: 'text' },
      { name: 'popperPlacement', type: 'string', default: "'bottom-start'", description: 'Calendar popover placement' },
      { name: 'monthsShown', type: 'number', description: 'Number of months to display side-by-side' },
      { name: 'shouldCloseOnSelect', type: 'boolean', default: 'true', description: 'Close calendar after selection', control: 'boolean' },
      { name: 'initialStartDate', type: 'Date', default: 'new Date()', description: 'Initial range start date' },
      { name: 'initialEndDate', type: 'Date', default: 'null', description: 'Initial range end date' },
      { name: 'onChange', type: '({startDate, endDate}) => void', required: true, description: 'Callback with {startDate, endDate} on selection' },
      { name: 'open', type: 'boolean', description: 'Force calendar open state' },
      { name: 'disableFutureDates', type: 'boolean', description: 'Prevent selecting future dates', control: 'boolean' },
      { name: 'allowSingleDate', type: 'boolean', default: 'false', description: 'Allow selecting a single date instead of range', control: 'boolean' },
      { name: 'selectFutureDates', type: 'boolean', default: 'false', description: 'Only allow future dates', control: 'boolean' }
    ],
    relatedComponents: ['single-date-picker'],
    preview: { type: 'input', defaults: { monthsShown: 2 } }
  },
  {
    name: 'SingleDatePicker',
    slug: 'single-date-picker',
    description: 'Single date picker with custom input, configurable format, max date constraint, and disabled state. Uses react-datepicker with PickersCustomInput.',
    category: 'date-picker',
    path: 'src/components/SingleDatePicker.js',
    props: [
      { name: 'date', type: 'Date', required: true, description: 'Currently selected date' },
      { name: 'onChangeHandler', type: '(date) => void', required: true, description: 'Callback when date changes (falls back to new Date() if null)' },
      { name: 'name', type: 'string', description: 'Input name attribute' },
      { name: 'popperPlacement', type: 'string', description: 'Calendar popover placement' },
      { name: 'maxDate', type: 'Date', description: 'Maximum selectable date' },
      { name: 'dateFormat', type: 'string', default: "'dd-MMM-yyyy'", description: 'Date display format', control: 'text' },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Disable the input', control: 'boolean' },
      { name: 'size', type: 'string', description: 'Input size override' }
    ],
    relatedComponents: ['custom-date-range-picker'],
    preview: { type: 'input', defaults: { dateFormat: 'dd-MMM-yyyy' } }
  },
  {
    name: 'CommonDateRangePickers',
    slug: 'common-date-range-pickers',
    description: 'Advanced date range picker with preset ranges (Today, Last 7 days, Last 1 month, Last 3 months, All Time), custom range dialog with dual calendar, and future/past date modes. Used across 44+ pages including Hospital, Pharmacy, Compliance, and Reports.',
    category: 'date-picker',
    path: 'src/components/custom-date-picker/CommonDateRangePickers.js',
    props: [
      { name: 'onChange', type: '({startDate, endDate}) => void', required: true, description: 'Callback with selected date range' },
      { name: 'filterDates', type: '{ startDate, endDate }', description: 'Initial/controlled date range values' },
      { name: 'showFutureDates', type: 'boolean', default: 'false', description: 'Show future date presets (Next 7 days, Next 1 month, etc.)', control: 'boolean' },
      { name: 'showAllTime', type: 'boolean', default: 'false', description: 'Show "All Time" option in presets', control: 'boolean' },
      { name: 'useCustomText', type: 'boolean', default: 'false', description: 'Use custom button text instead of date range', control: 'boolean' },
      { name: 'customText', type: 'string', default: "''", description: 'Custom button text (when useCustomText is true)', control: 'text' }
    ],
    relatedComponents: ['custom-date-range-picker', 'single-date-picker', 'custom-option-date-range-pickers'],
    preview: { type: 'input', defaults: {} }
  },
  {
    name: 'CustomOptionDateRangePickers',
    slug: 'custom-option-date-range-pickers',
    description: 'Extended date range picker with all features of CommonDateRangePickers plus a single-date toggle mode. Allows switching between range and single date selection.',
    category: 'date-picker',
    path: 'src/components/custom-date-picker/CustomOptionDateRangePickers.js',
    props: [
      { name: 'onChange', type: '({startDate, endDate} | date) => void', required: true, description: 'Callback — returns range or single date depending on mode' },
      { name: 'filterDates', type: '{ startDate, endDate }', description: 'Initial/controlled date range values' },
      { name: 'showFutureDates', type: 'boolean', default: 'false', description: 'Show future date presets', control: 'boolean' },
      { name: 'showAllTime', type: 'boolean', default: 'false', description: 'Show "All Time" option', control: 'boolean' },
      { name: 'useCustomText', type: 'boolean', default: 'false', description: 'Use custom button text', control: 'boolean' },
      { name: 'customText', type: 'string', default: "''", description: 'Custom button text', control: 'text' }
    ],
    relatedComponents: ['common-date-range-pickers', 'custom-date-range-picker'],
    preview: { type: 'input', defaults: {} }
  },

  // Forms & Inputs
  {
    name: 'RichTextEditor',
    slug: 'rich-text-editor',
    description: 'Quill-based rich text editor with Snow theme, full formatting toolbar (headers, bold/italic/underline, lists, links, code blocks), lazy-loaded Quill instance, and HTML/Delta/text output.',
    category: 'form',
    path: 'src/components/RichTextEditor.js',
    props: [
      { name: 'value', type: 'string | { html, delta, text }', description: 'Editor content — string (HTML) or object with html/delta/text', control: 'text' },
      { name: 'onChange', type: '({ html, delta, text }) => void', required: true, description: 'Callback with { html, delta, text } on every change' },
      { name: 'label', type: 'string', description: 'Label text above the editor', control: 'text' },
      { name: 'placeholder', type: 'string', default: "'Start typing...'", description: 'Placeholder text inside editor', control: 'text' },
      { name: 'minHeight', type: 'number', default: '200', description: 'Minimum editor height in px' }
    ],
    relatedComponents: ['input-with-multiple-values', 'pickers-custom-input'],
    preview: { type: 'input', defaults: { placeholder: 'Start typing...', label: 'Notes' } }
  },
  {
    name: 'InputwithMultipleValues',
    slug: 'input-with-multiple-values',
    description: 'TextField with chip display for entering multiple values via keyboard (Enter key adds a chip).',
    category: 'form',
    path: 'src/components/inputWithMultipleValues/index.js',
    props: [
      { name: 'name', type: 'string', required: true, description: 'Input field name attribute', control: 'text' }
    ],
    relatedComponents: ['rich-text-editor'],
    preview: { type: 'input', defaults: {} }
  },
  {
    name: 'PickersCustomInput',
    slug: 'pickers-custom-input',
    description: 'Custom TextField wrapper for date pickers with optional read-only mode. Used as the input component for react-datepicker.',
    category: 'form',
    path: 'src/components/PickersCustomInput.js',
    props: [
      { name: 'label', type: 'string', description: 'Input label text', control: 'text' },
      { name: 'readOnly', type: 'boolean', description: 'Make input read-only', control: 'boolean' }
    ],
    relatedComponents: ['single-date-picker', 'custom-date-range-picker'],
    preview: { type: 'input', defaults: { label: 'Select Date' } }
  },
  // ── Controlled Form Fields (React Hook Form integrated) ──
  {
    name: 'ControlledTextField',
    slug: 'controlled-text-field',
    description: 'React Hook Form controlled TextField with label, validation errors, required indicator, and optional helper text. Supports text/number/password types.',
    category: 'form',
    path: 'src/views/forms/form-fields/ControlledTextField.js',
    props: [
      { name: 'name', type: 'string', required: true, description: 'Field name — must match form schema key' },
      { name: 'label', type: 'string', required: true, description: 'Input label', control: 'text' },
      { name: 'control', type: 'Control', required: true, description: 'React Hook Form control object' },
      { name: 'errors', type: 'object', description: 'React Hook Form errors object' },
      { name: 'required', type: 'boolean', default: 'false', description: 'Show required asterisk', control: 'boolean' },
      { name: 'fullWidth', type: 'boolean', default: 'true', description: 'Full width input', control: 'boolean' },
      { name: 'type', type: "'text' | 'number' | 'password'", default: "'text'", description: 'Input type', control: 'select', options: ['text', 'number', 'password'] },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Disable the field', control: 'boolean' },
      { name: 'readOnly', type: 'boolean', default: 'false', description: 'Read-only mode', control: 'boolean' }
    ],
    relatedComponents: ['controlled-text-area', 'controlled-select']
  },
  {
    name: 'ControlledTextArea',
    slug: 'controlled-text-area',
    description: 'React Hook Form controlled multiline TextField with configurable rows.',
    category: 'form',
    path: 'src/views/forms/form-fields/ControlledTextArea.js',
    props: [
      { name: 'name', type: 'string', required: true, description: 'Field name' },
      { name: 'label', type: 'string', required: true, description: 'Input label', control: 'text' },
      { name: 'control', type: 'Control', required: true, description: 'React Hook Form control' },
      { name: 'errors', type: 'object', description: 'Errors object' },
      { name: 'required', type: 'boolean', default: 'false', description: 'Required indicator', control: 'boolean' },
      { name: 'rows', type: 'number', default: '4', description: 'Number of visible text rows' },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Disable field', control: 'boolean' },
      { name: 'readOnly', type: 'boolean', default: 'false', description: 'Read-only mode', control: 'boolean' }
    ],
    relatedComponents: ['controlled-text-field']
  },
  {
    name: 'ControlledSelect',
    slug: 'controlled-select',
    description: 'React Hook Form controlled Select dropdown with options array and custom label rendering.',
    category: 'form',
    path: 'src/views/forms/form-fields/ControlledSelect.js',
    props: [
      { name: 'name', type: 'string', required: true, description: 'Field name' },
      { name: 'label', type: 'string', required: true, description: 'Select label', control: 'text' },
      { name: 'control', type: 'Control', required: true, description: 'React Hook Form control' },
      { name: 'errors', type: 'object', description: 'Errors object' },
      { name: 'options', type: 'Array', default: '[]', required: true, description: 'Dropdown options array' },
      { name: 'required', type: 'boolean', default: 'false', description: 'Required indicator', control: 'boolean' },
      { name: 'size', type: 'string', default: "'large'", description: 'Select size' },
      { name: 'getOptionLabel', type: '(option) => string', description: 'Custom label renderer for options' }
    ],
    relatedComponents: ['controlled-autocomplete', 'controlled-select-with-text-field']
  },
  {
    name: 'ControlledAutocomplete',
    slug: 'controlled-autocomplete',
    description: 'React Hook Form controlled Autocomplete with search, loading state, multiple selection, async options, and custom rendering.',
    category: 'form',
    path: 'src/views/forms/form-fields/ControlledAutocomplete.js',
    props: [
      { name: 'name', type: 'string', required: true, description: 'Field name' },
      { name: 'label', type: 'string', required: true, description: 'Input label', control: 'text' },
      { name: 'control', type: 'Control', required: true, description: 'React Hook Form control' },
      { name: 'errors', type: 'object', description: 'Errors object' },
      { name: 'options', type: 'Array', default: '[]', required: true, description: 'Options array' },
      { name: 'loading', type: 'boolean', default: 'false', description: 'Show loading spinner', control: 'boolean' },
      { name: 'required', type: 'boolean', default: 'false', description: 'Required indicator', control: 'boolean' },
      { name: 'multiple', type: 'boolean', default: 'false', description: 'Allow multiple selection', control: 'boolean' }
    ],
    relatedComponents: ['controlled-select']
  },
  {
    name: 'ControlledCheckBox',
    slug: 'controlled-checkbox',
    description: 'React Hook Form controlled Checkbox with label, placement options, size, and color customization.',
    category: 'form',
    path: 'src/views/forms/form-fields/ControlledCheckBox.js',
    props: [
      { name: 'name', type: 'string', required: true, description: 'Field name' },
      { name: 'control', type: 'Control', required: true, description: 'React Hook Form control' },
      { name: 'label', type: 'string', description: 'Checkbox label text', control: 'text' },
      { name: 'errors', type: 'object', default: '{}', description: 'Errors object' },
      { name: 'required', type: 'boolean', default: 'false', description: 'Required', control: 'boolean' },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Disabled', control: 'boolean' },
      { name: 'labelPlacement', type: "'end' | 'start' | 'top' | 'bottom'", default: "'end'", description: 'Label position', control: 'select', options: ['end', 'start', 'top', 'bottom'] },
      { name: 'size', type: "'small' | 'medium'", default: "'medium'", description: 'Checkbox size', control: 'select', options: ['small', 'medium'] },
      { name: 'checkBoxColor', type: 'string', default: "'primary'", description: 'Checkbox color' }
    ],
    relatedComponents: ['controlled-switch', 'controlled-radio-group']
  },
  {
    name: 'ControlledSwitch',
    slug: 'controlled-switch',
    description: 'React Hook Form controlled Switch toggle with label, placement, size, and color.',
    category: 'form',
    path: 'src/views/forms/form-fields/ControlledSwitch.js',
    props: [
      { name: 'name', type: 'string', required: true, description: 'Field name' },
      { name: 'label', type: 'string', description: 'Switch label', control: 'text' },
      { name: 'control', type: 'Control', required: true, description: 'React Hook Form control' },
      { name: 'required', type: 'boolean', default: 'false', description: 'Required', control: 'boolean' },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Disabled', control: 'boolean' },
      { name: 'labelPosition', type: "'end' | 'start'", default: "'end'", description: 'Label position', control: 'select', options: ['end', 'start'] },
      { name: 'size', type: "'small' | 'medium'", default: "'medium'", description: 'Switch size', control: 'select', options: ['small', 'medium'] },
      { name: 'switchColor', type: 'string', default: "'primary.main'", description: 'Switch track color' }
    ],
    relatedComponents: ['controlled-checkbox']
  },
  {
    name: 'ControlledRadioGroup',
    slug: 'controlled-radio-group',
    description: 'React Hook Form controlled Radio button group with row/column layout, options array, and color customization.',
    category: 'form',
    path: 'src/views/forms/form-fields/ControlledRadioGroup.js',
    props: [
      { name: 'name', type: 'string', required: true, description: 'Field name' },
      { name: 'control', type: 'Control', required: true, description: 'React Hook Form control' },
      { name: 'options', type: 'Array<{label, value}>', default: '[]', required: true, description: 'Radio options' },
      { name: 'label', type: 'string', description: 'Group label', control: 'text' },
      { name: 'required', type: 'boolean', default: 'false', description: 'Required', control: 'boolean' },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Disabled', control: 'boolean' },
      { name: 'row', type: 'boolean', default: 'false', description: 'Horizontal layout', control: 'boolean' },
      { name: 'radioColor', type: 'string', default: "'primary'", description: 'Radio button color' }
    ],
    relatedComponents: ['controlled-checkbox', 'controlled-switch']
  },
  {
    name: 'ControlledDatePicker',
    slug: 'controlled-date-picker',
    description: 'React Hook Form controlled MUI DatePicker with min/max date constraints and custom views.',
    category: 'form',
    path: 'src/views/forms/form-fields/ControlledDatePicker.js',
    props: [
      { name: 'name', type: 'string', required: true, description: 'Field name' },
      { name: 'control', type: 'Control', required: true, description: 'React Hook Form control' },
      { name: 'label', type: 'string', default: "'Select Date'", description: 'Input label', control: 'text' },
      { name: 'required', type: 'boolean', default: 'false', description: 'Required', control: 'boolean' },
      { name: 'minDate', type: 'Date', description: 'Minimum selectable date' },
      { name: 'maxDate', type: 'Date', description: 'Maximum selectable date' },
      { name: 'views', type: 'Array', description: 'Visible date views (year, month, day)' },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Disabled', control: 'boolean' }
    ],
    relatedComponents: ['controlled-time-picker', 'single-date-picker']
  },
  {
    name: 'ControlledTimePicker',
    slug: 'controlled-time-picker',
    description: 'React Hook Form controlled MUI TimePicker with AM/PM toggle, custom format, and minutes step.',
    category: 'form',
    path: 'src/views/forms/form-fields/ControlledTimePicker.js',
    props: [
      { name: 'name', type: 'string', required: true, description: 'Field name' },
      { name: 'control', type: 'Control', required: true, description: 'React Hook Form control' },
      { name: 'label', type: 'string', default: "'Select Time'", description: 'Input label', control: 'text' },
      { name: 'required', type: 'boolean', default: 'false', description: 'Required', control: 'boolean' },
      { name: 'format', type: 'string', default: "'hh:mm A'", description: 'Time display format', control: 'text' },
      { name: 'ampm', type: 'boolean', default: 'true', description: 'Show AM/PM toggle', control: 'boolean' },
      { name: 'minutesStep', type: 'number', default: '1', description: 'Minutes step increment' },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Disabled', control: 'boolean' }
    ],
    relatedComponents: ['controlled-date-picker']
  },
  {
    name: 'ControlledFileUpload',
    slug: 'controlled-file-upload',
    description: 'React Hook Form controlled single file upload with accepted file types, label, and validation.',
    category: 'form',
    path: 'src/views/forms/form-fields/ControlledFileUpload.js',
    props: [
      { name: 'name', type: 'string', required: true, description: 'Field name' },
      { name: 'control', type: 'Control', required: true, description: 'React Hook Form control' },
      { name: 'label', type: 'string', description: 'Upload label', control: 'text' },
      { name: 'errors', type: 'object', description: 'Errors object' },
      { name: 'color', type: 'string', description: 'Button color' },
      { name: 'acceptFileTypes', type: 'string', default: "'.pdf,.doc,.docx,.jpg,.jpeg,.png'", description: 'Accepted file types', control: 'text' }
    ],
    relatedComponents: ['controlled-multi-file-upload', 'file-uploader-single']
  },
  {
    name: 'ControlledSelectWithTextField',
    slug: 'controlled-select-with-text-field',
    description: 'Combo field — React Hook Form controlled Select dropdown paired with a TextField input, with optional second select.',
    category: 'form',
    path: 'src/views/forms/form-fields/ControlledSelectWithTextField.js',
    props: [
      { name: 'textFieldName', type: 'string', required: true, description: 'Text input field name' },
      { name: 'selectFieldName', type: 'string', required: true, description: 'Select dropdown field name' },
      { name: 'secondSelectFieldName', type: 'string', default: "''", description: 'Optional second select field name' },
      { name: 'control', type: 'Control', required: true, description: 'React Hook Form control' },
      { name: 'errors', type: 'object', description: 'Errors object' },
      { name: 'label', type: 'string', description: 'Field label', control: 'text' },
      { name: 'placeholder', type: 'string', default: "'Enter value'", description: 'Text input placeholder', control: 'text' },
      { name: 'required', type: 'boolean', default: 'false', description: 'Required', control: 'boolean' }
    ],
    relatedComponents: ['controlled-select', 'controlled-text-field']
  },
  // ── File Uploaders ──
  {
    name: 'FileUploaderSingle',
    slug: 'file-uploader-single',
    description: 'Drag-and-drop single file uploader with image preview and remove capability.',
    category: 'form',
    path: 'src/views/forms/form-elements/file-uploader/FileUploaderSingle.js',
    props: [
      { name: 'files', type: 'Array', description: 'Currently available files' },
      { name: 'onImageUpload', type: '(files) => void', required: true, description: 'Upload callback with selected files' },
      { name: 'image', type: 'string', description: 'Existing image URL' },
      { name: 'onRemoveImage', type: '() => void', default: 'null', description: 'Remove image callback' }
    ],
    relatedComponents: ['controlled-file-upload']
  },
  {
    name: 'ConfirmationCheckBox',
    slug: 'confirmation-checkbox',
    description: 'Styled checkbox with title, description, and color-themed card wrapper. Used for confirmation flows.',
    category: 'form',
    path: 'src/views/forms/form-elements/confirmationCheckBox/index.js',
    props: [
      { name: 'color', type: 'string', description: 'Theme color for the card border/accent', control: 'color' },
      { name: 'label', type: 'string', description: 'Checkbox label text', control: 'text' },
      { name: 'value', type: 'boolean', required: true, description: 'Checked state', control: 'boolean' },
      { name: 'setValue', type: '(boolean) => void', required: true, description: 'State setter callback' },
      { name: 'title', type: 'string', description: 'Card title text', control: 'text' },
      { name: 'description', type: 'string', description: 'Description below the title', control: 'text' }
    ],
    relatedComponents: ['controlled-checkbox']
  },

  {
    name: 'CommonTable',
    slug: 'common-table',
    description: 'Primary DataGrid v8 table — server-side pagination, sorting, row selection with checkboxes, column visibility, search toolbar, custom row styling, and configurable row height. Used across all major listing pages.',
    category: 'table',
    path: 'src/views/table/data-grid/CommonTable.js',
    props: [
      { name: 'indexedRows', type: 'Array', required: true, description: 'Table data rows (pre-indexed)' },
      { name: 'columns', type: 'Array', required: true, description: 'DataGrid column definitions' },
      { name: 'total', type: 'number', required: true, description: 'Total row count for pagination' },
      { name: 'paginationModel', type: '{ page, pageSize }', required: true, description: 'Current page and page size' },
      { name: 'setPaginationModel', type: '(model) => void', required: true, description: 'Pagination change handler' },
      { name: 'handleSortModel', type: '(model) => void', description: 'Sort model change handler' },
      { name: 'loading', type: 'boolean', description: 'Loading overlay state', control: 'boolean' },
      { name: 'pageSizeOptions', type: 'number[]', description: 'Page size dropdown options' },
      { name: 'onRowClick', type: '(params) => void', description: 'Row click handler' },
      { name: 'onCellClick', type: '(params) => void', description: 'Cell click handler' },
      { name: 'searchValue', type: 'string', description: 'Search input value for toolbar' },
      { name: 'handleSearch', type: '(value) => void', description: 'Search change handler' },
      { name: 'columnVisibilityModel', type: 'object', description: 'Column visibility map {colName: boolean}' },
      { name: 'checkBoxOption', type: 'boolean', description: 'Enable row selection checkboxes', control: 'boolean' },
      { name: 'onRowSelectionModelChange', type: '(model) => void', description: 'Selection change handler' },
      { name: 'selectedRows', type: 'Array', description: 'Currently selected row IDs or objects' },
      { name: 'hideFooterPagination', type: 'boolean', default: 'false', description: 'Hide pagination footer', control: 'boolean' },
      { name: 'hideFooter', type: 'boolean', default: 'false', description: 'Hide entire footer', control: 'boolean' },
      { name: 'disablePagination', type: 'boolean', default: 'false', description: 'Disable pagination completely', control: 'boolean' },
      { name: 'maxHeight', type: 'number | string', description: 'Maximum table height' },
      { name: 'rowHeight', type: 'number', default: '52', description: 'Row height in px' },
      { name: 'getRowHeight', type: '(params) => number', description: 'Dynamic row height function' },
      { name: 'getRowClassName', type: '(params) => string', description: 'Conditional row CSS class' },
      { name: 'getRowId', type: '(row) => string', description: 'Custom row ID getter' },
      { name: 'externalTableStyle', type: 'object', description: 'Custom DataGrid sx overrides' }
    ],
    relatedComponents: ['react-table'],
    preview: { type: 'table', defaults: { loading: false } }
  },
  {
    name: 'ReactTable',
    slug: 'react-table',
    description: 'Feature-rich table using TanStack React Table — virtual scrolling, column pinning, row selection, local/server search, sortable headers, custom row/cell styling, and configurable pagination.',
    category: 'table',
    path: 'src/views/table/ReactTable.js',
    props: [
      { name: 'rows', type: 'Array', default: '[]', required: true, description: 'Table data rows' },
      { name: 'columns', type: 'Array', default: '[]', required: true, description: 'Column definitions (accessorKey, header, cell, size, etc.)' },
      { name: 'rowCount', type: 'number', default: '0', description: 'Total rows for server-side pagination' },
      { name: 'pagination', type: 'boolean', default: 'true', description: 'Enable pagination', control: 'boolean' },
      { name: 'pageSizeOptions', type: 'number[]', default: '[5, 10, 20]', description: 'Page size options' },
      { name: 'paginationModel', type: '{ page, pageSize }', description: 'Pagination state' },
      { name: 'onPaginationModelChange', type: '(model) => void', description: 'Pagination change callback' },
      { name: 'rowHeight', type: 'number', default: '74', description: 'Row height in px' },
      { name: 'headerHeight', type: 'number', default: '55', description: 'Header row height' },
      { name: 'loading', type: 'boolean', default: 'false', description: 'Loading state', control: 'boolean' },
      { name: 'onRowClick', type: '(row) => void', description: 'Row click handler' },
      { name: 'onSortChange', type: '(sort) => void', description: 'Sort change handler' },
      { name: 'rowSelection', type: 'boolean', default: 'false', description: 'Enable row selection', control: 'boolean' },
      { name: 'onRowSelect', type: '(rows) => void', description: 'Row selection callback' },
      { name: 'headerName', type: 'string', description: 'Table header title', control: 'text' },
      { name: 'searchMode', type: "'local' | 'server'", default: "'local'", description: 'Search mode', control: 'select', options: ['local', 'server'] },
      { name: 'onSearch', type: '(query) => void', description: 'Search callback (server mode)' },
      { name: 'serverSide', type: 'boolean', default: 'false', description: 'Enable server-side pagination', control: 'boolean' },
      { name: 'hideHeaderWhenEmpty', type: 'boolean', default: 'false', description: 'Hide header when no rows', control: 'boolean' },
      { name: 'modifyColumnPinning', type: 'boolean', default: 'false', description: 'Allow column pinning changes', control: 'boolean' }
    ],
    relatedComponents: ['common-table', 'sticky-table'],
    preview: { type: 'table', defaults: { loading: false } }
  },
  {
    name: 'StickyTable',
    slug: 'sticky-table',
    description: 'Sticky header table — same API as ReactTable but with fixed header on scroll. Supports row selection, pagination, search, sort, Excel download, and custom styling.',
    category: 'table',
    path: 'src/views/table/sticky-table.js',
    props: [
      { name: 'rows', type: 'Array', default: '[]', required: true, description: 'Table data rows' },
      { name: 'columns', type: 'Array', default: '[]', required: true, description: 'Column definitions' },
      { name: 'rowCount', type: 'number', default: '0', description: 'Total rows for pagination' },
      { name: 'pagination', type: 'boolean', default: 'true', description: 'Enable pagination', control: 'boolean' },
      { name: 'loading', type: 'boolean', default: 'false', description: 'Loading state', control: 'boolean' },
      { name: 'rowHeight', type: 'number', default: '74', description: 'Row height in px' },
      { name: 'headerHeight', type: 'number', default: '55', description: 'Header height' },
      { name: 'rowSelection', type: 'boolean', default: 'false', description: 'Enable row selection', control: 'boolean' },
      { name: 'downloadExcel', type: 'boolean', default: 'false', description: 'Show Excel download button', control: 'boolean' },
      { name: 'headerName', type: 'string', description: 'Table header title', control: 'text' },
      { name: 'onRowClick', type: '(row) => void', description: 'Row click handler' },
      { name: 'onSortChange', type: '(sort) => void', description: 'Sort change handler' },
      { name: 'onRowSelect', type: '(rows) => void', description: 'Selection callback' }
    ],
    relatedComponents: ['react-table', 'common-table'],
    preview: { type: 'table', defaults: { loading: false } }
  },

  // Media
  {
    name: 'ImageCarousel',
    slug: 'image-carousel',
    description:
      'Advanced carousel with keyboard navigation, auto-play, dots pagination, counter badge, error handling, and RTL support.',
    category: 'media',
    path: 'src/components/common/ImageCarousel.tsx',
    props: [
      { name: 'images', type: 'string[]', description: 'Array of image URLs' },
      { name: 'autoPlay', type: 'boolean', default: 'false', description: 'Enable auto-play', control: 'boolean' },
      { name: 'showDots', type: 'boolean', default: 'true', description: 'Show dot indicators', control: 'boolean' },
      {
        name: 'showCounter',
        type: 'boolean',
        default: 'false',
        description: 'Show image counter badge',
        control: 'boolean'
      }
    ],
    relatedComponents: ['image-wrapper', 'more-media-listing'],
    preview: { type: 'media', defaults: { autoPlay: false, showDots: true, showCounter: true } }
  },
  {
    name: 'ImageWrapper',
    slug: 'image-wrapper',
    description: 'Smart image component with SVG detection, fallback handling, and error recovery.',
    category: 'media',
    path: 'src/components/ImageWrapper.js',
    props: [
      { name: 'src', type: 'string', description: 'Image source URL', control: 'text' },
      { name: 'alt', type: 'string', description: 'Alt text', control: 'text' },
      { name: 'fallbackSrc', type: 'string', description: 'Fallback image URL' },
      { name: 'width', type: 'number | string', description: 'Image width' },
      { name: 'height', type: 'number | string', description: 'Image height' }
    ],
    relatedComponents: ['image-carousel'],
    preview: { type: 'media', defaults: { src: '/images/branding/Antz_logomark_h_color.svg', alt: 'Antz Logo' } }
  },

  // Buttons
  {
    name: 'ButtonContained',
    slug: 'button-contained',
    description: 'Add button with plus icon and disabled state support.',
    category: 'button',
    path: 'src/components/ButtonContained.js',
    props: [
      { name: 'title', type: 'string', description: 'Button label text', control: 'text' },
      { name: 'onClick', type: '() => void', description: 'Click handler' },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Disable the button', control: 'boolean' }
    ],
    relatedComponents: [],
    preview: { type: 'button', defaults: { title: 'Add Animal', disabled: false } }
  },

  // Notifications
  {
    name: 'Toaster',
    slug: 'toaster',
    description: 'Toast notification with icon (success/warning/error), message, and close button using react-hot-toast.',
    category: 'notification',
    path: 'src/components/Toaster.js',
    props: [
      { name: 'message', type: 'string', description: 'Toast message text', control: 'text' },
      {
        name: 'type',
        type: "'success' | 'warning' | 'error'",
        default: "'success'",
        description: 'Toast type/severity',
        control: 'select',
        options: ['success', 'warning', 'error']
      },
      { name: 'onClose', type: '() => void', description: 'Close callback' }
    ],
    relatedComponents: [],
    preview: {
      type: 'notification',
      defaults: { message: 'Animal record saved successfully!', type: 'success' }
    }
  },

  // Display
  {
    name: 'EmptyStateBox',
    slug: 'empty-state-box',
    description: 'Empty state placeholder with image and text message for no-data scenarios.',
    category: 'display',
    path: 'src/components/EmptyStateBox.js',
    props: [
      { name: 'image', type: 'string', description: 'Illustration image URL' },
      { name: 'message', type: 'string', description: 'Empty state message', control: 'text' }
    ],
    relatedComponents: ['text-ellipsis-with-modal'],
    preview: { type: 'card', defaults: { message: 'No animals found in this enclosure' } }
  },
  {
    name: 'TextEllipsisWithModal',
    slug: 'text-ellipsis-with-modal',
    description: 'Text truncation component with tooltip and optional modal expansion for long text.',
    category: 'display',
    path: 'src/components/TextEllipsisWithModal.js',
    props: [
      { name: 'text', type: 'string', description: 'Text to display/truncate', control: 'text' },
      { name: 'maxWidth', type: 'number', description: 'Max width before truncation' },
      {
        name: 'showModal',
        type: 'boolean',
        default: 'true',
        description: 'Enable click-to-expand modal',
        control: 'boolean'
      }
    ],
    relatedComponents: ['empty-state-box'],
    preview: {
      type: 'card',
      defaults: {
        text: 'Panthera tigris — The Bengal Tiger is one of the most iconic big cats found in the Indian subcontinent and Southeast Asia.',
        maxWidth: 200,
        showModal: true
      }
    }
  },
  {
    name: 'CustomSwitchTabs',
    slug: 'custom-switch-tabs',
    description: 'Toggle button group tabs with exclusive selection and custom theming.',
    category: 'navigation',
    path: 'src/components/CustomSwitchTabs.js',
    props: [
      { name: 'tabs', type: 'Array', description: 'Tab items array [{label, value}]' },
      { name: 'value', type: 'string', description: 'Currently selected tab value' },
      { name: 'onChange', type: '(value) => void', description: 'Tab change callback' }
    ],
    relatedComponents: ['menu-with-dots'],
    preview: {
      type: 'tabs',
      defaults: { tabs: ['Overview', 'Medical', 'Diet', 'History'], value: 'Overview' }
    }
  },

  // Hooks
  {
    name: 'useAuth',
    slug: 'use-auth',
    description: 'Authentication context hook returning user data and authentication state.',
    category: 'hook',
    path: 'src/hooks/useAuth.js',
    props: [
      { name: 'returns.user', type: 'object | null', description: 'Current authenticated user data' },
      { name: 'returns.loading', type: 'boolean', description: 'Auth loading state' },
      { name: 'returns.login', type: '(params) => Promise', description: 'Login function' },
      { name: 'returns.logout', type: '() => void', description: 'Logout function' }
    ]
  },
  {
    name: 'useDebounce',
    slug: 'use-debounce',
    description: 'Debounce hook for delaying value updates, useful for search inputs and API calls.',
    category: 'hook',
    path: 'src/hooks/useDebounce.js',
    props: [
      { name: 'value', type: 'any', description: 'Value to debounce' },
      { name: 'delay', type: 'number', default: '500', description: 'Delay in milliseconds' },
      { name: 'returns', type: 'any', description: 'Debounced value' }
    ]
  },
  {
    name: 'useInfiniteScroll',
    slug: 'use-infinite-scroll',
    description: 'Hook for infinite scroll pagination with intersection observer support.',
    category: 'hook',
    path: 'src/hooks/useInfiniteScroll.js',
    props: [
      { name: 'callback', type: '() => void', description: 'Function to call when scrolled to bottom' },
      { name: 'isLoading', type: 'boolean', description: 'Current loading state' },
      { name: 'hasMore', type: 'boolean', description: 'Whether more data is available' },
      { name: 'returns', type: 'RefObject', description: 'Ref to attach to sentinel element' }
    ]
  },
  {
    name: 'useSafeRouter',
    slug: 'use-safe-router',
    description:
      'Universal router hook supporting both Next.js Page Router and App Router with window.location fallback.',
    category: 'hook',
    path: 'src/hooks/useSafeRouter.js',
    props: [
      { name: 'returns.push', type: '(url) => void', description: 'Navigate to URL' },
      { name: 'returns.replace', type: '(url) => void', description: 'Replace current URL' },
      { name: 'returns.back', type: '() => void', description: 'Go back' },
      { name: 'returns.pathname', type: 'string', description: 'Current pathname' },
      { name: 'returns.query', type: 'object', description: 'Query parameters' }
    ]
  },

  // ==================== VIEWS ====================
  {
    name: 'AnimalCard',
    slug: 'animal-card',
    description: 'Full animal display card with avatar, gender badge (M/F/G/UD/ID), local identifier, Primary Diet badge, common name, scientific name, age, weight (clickable), breed, variant, discovered date, mother ID, and location trail (enclosure/section/site).',
    category: 'view',
    path: 'src/views/utility/AnimalCard.js',
    props: [
      { name: 'data', type: 'object', required: true, description: 'Animal data object (see data.* fields below)' },
      { name: 'data.default_icon', type: 'string', description: 'Avatar image URL (falls back to Antz logo SVG)' },
      { name: 'data.animal_id', type: 'string', description: 'Animal ID — shown as "AID: xxx" when no local identifier' },
      { name: 'data.local_identifier_name', type: 'string', description: 'Identifier label (e.g., "Tag ID", "Microchip")' },
      { name: 'data.local_identifier_value', type: 'string', description: 'Identifier value' },
      { name: 'data.common_name', type: 'string', description: 'Common name (bold 16px)' },
      { name: 'data.scientific_name', type: 'string', description: 'Scientific name (italic 13px)' },
      { name: 'data.sex', type: "'male' | 'female' | 'undetermined' | 'indeterminate'", description: 'Sex — renders M/F/UD/ID badge with color coding' },
      { name: 'data.type', type: "'individual' | 'group'", default: "'individual'", description: "Type — 'group' shows G badge and Count" },
      { name: 'data.total_animal', type: 'number', description: 'Group animal count (only when type=group)' },
      { name: 'data.is_primary', type: "'0' | '1'", description: "Shows 'Primary Diet' green badge when '1'" },
      { name: 'data.age', type: 'string', description: 'Age text (e.g., "5 years")' },
      { name: 'data.weight', type: 'string', description: 'Weight text (e.g., "190 kg") — clickable if onWeightClick provided' },
      { name: 'data.breed_name', type: 'string', description: 'Breed name' },
      { name: 'data.morph_name', type: 'string', description: 'Variant/morph name' },
      { name: 'data.discovered', type: 'string', description: 'Discovery UTC datetime — formatted to local date + time' },
      { name: 'data.mortality_date', type: 'string', description: 'Mortality UTC datetime — shown in orange when present' },
      { name: 'data.mother_id', type: 'string', description: 'Mother animal ID' },
      { name: 'data.user_enclosure_name', type: 'string', description: 'Enclosure name (e.g., "Savanna Hall")' },
      { name: 'data.section_name', type: 'string', description: 'Section name (e.g., "South Wing")' },
      { name: 'data.site_name', type: 'string', description: 'Site name (e.g., "Main Zoo")' },
      { name: 'size', type: 'string', description: 'Font size override for identifier text' },
      { name: 'edit', type: 'boolean', description: 'Edit mode — reduces max-width of identifier text' },
      { name: 'valueColor', type: 'string', description: 'Override color for all text values' },
      { name: 'onWeightClick', type: '(data) => void', description: 'Makes weight clickable with underline hover effect' },
      { name: 'maxWidth', type: 'string', default: "'200px'", description: 'Max-width for identifier text' }
    ],
    preview: { type: 'card', defaults: {} },
    relatedComponents: ['animal-card-basic', 'animal-label-card']
  },
  {
    name: 'AnimalCardBasic',
    slug: 'animal-card-basic',
    description: 'Simplified horizontal animal card — 56px rounded avatar, capitalized name with TextEllipsis, italic scientific name, age + gender line.',
    category: 'view',
    path: 'src/views/utility/AnimalCardBasic.js',
    props: [
      { name: 'image', type: 'string', description: 'Animal avatar URL (falls back to /icons/antz.svg)' },
      { name: 'name', type: 'string', description: 'Common name — auto-capitalized (e.g., "african lion" → "African Lion")' },
      { name: 'scientificName', type: 'string', description: 'Scientific name — capitalized, italic 14px' },
      { name: 'age', type: 'string', description: 'Age text (e.g., "5 years") — hidden if null/empty' },
      { name: 'gender', type: 'string', description: 'Gender text (e.g., "male") — shown after age with bullet separator' }
    ],
    relatedComponents: ['animal-card', 'animal-label-card'],
    preview: { type: 'card', defaults: {} }
  },
  {
    name: 'AnimalLabelCard',
    slug: 'animal-label-card',
    description: 'Compact label card with circular icon, title (bold 14px), subtitle and second subtitle (14px neutral) — used for animals, medicines, products. All text with ellipsis and tooltip.',
    category: 'view',
    path: 'src/views/utility/AnimalLabelCard.js',
    props: [
      { name: 'title', type: 'string', description: 'Primary label text (bold 14px)', control: 'text' },
      { name: 'subTitle', type: 'string', description: 'Secondary text (14px neutral gray)', control: 'text' },
      { name: 'secondSubTitle', type: 'string', description: 'Tertiary text (14px neutral gray)', control: 'text' },
      { name: 'icon', type: 'string', description: 'Icon image URL for circular avatar' },
      { name: 'bgColor', type: 'string', description: 'Background color for icon container', control: 'color' },
      { name: 'onClick', type: '() => void', description: 'Card click handler' },
      { name: 'rowWidth', type: 'number', default: '250', description: 'Max width for text truncation' },
      { name: 'imageDimension', type: 'number', default: '44', description: 'Icon avatar size in px' }
    ],
    relatedComponents: ['animal-card', 'animal-card-basic', 'pharmacy-product-card'],
    preview: { type: 'card', defaults: {} }
  },
  {
    name: 'SpeciesCard',
    slug: 'species-card',
    description: 'Species display card — 40px circular avatar, common name (bold 16px) with optional Primary Diet badge, italic scientific name. Uses tooltip/ellipsis.',
    category: 'view',
    path: 'src/views/utility/SpeciesCard.js',
    props: [
      { name: 'species', type: 'object', description: 'Species data object (see species.* fields)' },
      { name: 'species.default_icon', type: 'string', description: 'Species avatar/icon URL' },
      { name: 'species.common_name', type: 'string', description: 'Common name (bold 16px)' },
      { name: 'species.scientific_name', type: 'string', description: 'Scientific name (italic 16px)' },
      { name: 'species.complete_name', type: 'string', description: 'Full display name (fallback)' },
      { name: 'species.is_primary', type: "'0' | '1'", description: "Shows 'Primary Diet' badge when '1'" },
      { name: 'edit', type: 'boolean', description: 'Edit mode flag' }
    ],
    relatedComponents: ['species-illustration-card'],
    preview: { type: 'card', defaults: {} }
  },
  {
    name: 'SpeciesIllustrationCard',
    slug: 'species-illustration-card',
    description: 'Full-width card with 15:9 aspect ratio image overlay and dark gradient text overlay showing common + scientific name at bottom.',
    category: 'view',
    path: 'src/views/utility/SpeciesIllustrationCard.js',
    props: [
      { name: 'eggDetails', type: 'object', description: 'Egg/species data object' },
      { name: 'eggDetails.default_icon', type: 'string', description: 'Cover image URL' },
      { name: 'eggDetails.default_common_name', type: 'string', description: 'Common name (white, bold)' },
      { name: 'eggDetails.complete_name', type: 'string', description: 'Scientific name (white)' },
      { name: 'theme', type: 'Theme', description: 'MUI theme object' }
    ],
    relatedComponents: ['species-card'],
    preview: { type: 'card', defaults: {} }
  },
  {
    name: 'UserCard',
    slug: 'user-card',
    description: 'Selectable user card — 48px circular avatar, name (20px bold), role, radio button with green selected state. Background tints green (#F2FFF8) when selected.',
    category: 'view',
    path: 'src/views/utility/UserCard.js',
    props: [
      { name: 'name', type: 'string', description: 'User display name (20px bold)', control: 'text' },
      { name: 'uid', type: 'string', description: 'User unique identifier' },
      { name: 'image', type: 'string', description: 'Avatar image URL' },
      { name: 'role', type: 'string', description: 'User role text (16px)', control: 'text' },
      { name: 'radio', type: '{ checked, onChange }', description: 'Radio button state — checked shows filled green circle' }
    ],
    relatedComponents: ['user-avatar-details', 'fallback-avatar'],
    preview: { type: 'card', defaults: {} }
  },
  {
    name: 'UserAvatarDetails',
    slug: 'user-avatar-details',
    description: 'Avatar with name, date, and description. Supports small, medium, and large sizes.',
    category: 'view',
    path: 'src/views/utility/UserAvatarDetails.js',
    props: [
      { name: 'name', type: 'string', description: 'User display name', control: 'text' },
      { name: 'date', type: 'string', description: 'Date or subtitle text', control: 'text' },
      { name: 'description', type: 'string', description: 'Description text', control: 'text' },
      { name: 'size', type: "'small' | 'medium' | 'large'", default: "'medium'", description: 'Avatar size variant', control: 'select', options: ['small', 'medium', 'large'] }
    ],
    relatedComponents: ['user-card', 'fallback-avatar'],
    preview: { type: 'card', defaults: { message: 'Dr. Naseer — 15 Mar 2024' } }
  },
  {
    name: 'FallbackAvatar',
    slug: 'fallback-avatar',
    description: 'Avatar component with automatic fallback when image is missing or fails to load.',
    category: 'view',
    path: 'src/views/utility/FallbackAvatar.js',
    props: [
      { name: 'src', type: 'string', description: 'Avatar image URL' },
      { name: 'name', type: 'string', description: 'Name for initials fallback', control: 'text' }
    ],
    relatedComponents: ['fallback-image', 'user-avatar-details']
  },
  {
    name: 'FallbackImage',
    slug: 'fallback-image',
    description: 'Image component with automatic fallback when source fails to load.',
    category: 'view',
    path: 'src/views/utility/FallbackImage.js',
    props: [
      { name: 'src', type: 'string', description: 'Image source URL', control: 'text' },
      { name: 'fallbackSrc', type: 'string', description: 'Fallback image URL' },
      { name: 'alt', type: 'string', description: 'Alt text', control: 'text' }
    ],
    relatedComponents: ['fallback-avatar', 'image-wrapper']
  },
  {
    name: 'MediaCard (FilePreviewCard)',
    slug: 'media-card',
    description: 'File preview card with image/video/audio/document detection, user attribution, title bar with icon actions, and file dialog on click. Note: Old MediaCard.js is deprecated (commented out), this uses NewMediaCard.js (FilePreviewCard).',
    category: 'view',
    path: 'src/views/utility/NewMediaCard.js',
    props: [
      { name: 'fileUrl', type: 'string', required: true, description: 'File URL to preview' },
      { name: 'fileName', type: 'string', required: true, description: 'Original filename' },
      { name: 'user', type: '{ user_name, created_at }', description: 'Author info shown via UserAvatarDetails' },
      { name: 'width', type: 'number', description: 'Card width in px' },
      { name: 'height', type: 'number', description: 'Card height in px' },
      { name: 'showTitle', type: 'boolean', default: 'false', description: 'Show filename title bar at top' },
      { name: 'showTitleIcon', type: 'boolean', default: 'false', description: 'Show action icon in title bar' },
      { name: 'onTitleIconClick', type: '() => void', description: 'Title icon click handler' },
      { name: 'cardStyle', type: 'object', default: '{}', description: 'Custom card styles' },
      { name: 'actions', type: 'ReactNode', default: 'null', description: 'Custom action buttons overlay' },
      { name: 'onDeleteaction', type: '() => void', description: 'Delete button handler' },
      { name: 'ondownloadaction', type: '() => void', description: 'Download button handler' },
      { name: 'isDeleteLoading', type: 'boolean', default: 'false', description: 'Loading state for delete action' },
      { name: 'downloadUrl', type: 'string', default: 'null', description: 'Direct download URL override' }
    ],
    relatedComponents: ['image-preview'],
    preview: { type: 'media', defaults: { showDots: false } }
  },
  {
    name: 'ImagePreview',
    slug: 'image-preview',
    description: 'Image preview card — teal background (#E8F4F2), clickable image (opens in new tab), close button (top-right), zoom controls, filename + creation date below.',
    category: 'view',
    path: 'src/views/utility/ImagePreview.js',
    props: [
      { name: 'imageSrc', type: 'string', description: 'Image source URL' },
      { name: 'imageDetails', type: '{ name, created_at }', description: 'Image metadata — name and creation timestamp' },
      { name: 'onClose', type: '() => void', description: 'Close/remove callback' },
      { name: 'altText', type: 'string', default: "'preview'", description: 'Image alt text' },
      { name: 'width', type: 'number', default: '200', description: 'Card width in px' },
      { name: 'height', type: 'number', default: '150', description: 'Card height in px' },
      { name: 'loader', type: 'boolean', description: 'Loading state — disables zoom buttons' }
    ],
    relatedComponents: ['media-card']
  },
  {
    name: 'ObservationCard',
    slug: 'observation-card',
    description: 'Simple observation card — title (bold 16px), comma-separated description joined with bullets (max 300px), date + time with bullet separator.',
    category: 'view',
    path: 'src/views/utility/ObservationCard.js',
    props: [
      { name: 'title', type: 'string', description: 'Observation title (bold 16px)', control: 'text' },
      { name: 'description', type: 'string', description: 'Comma-separated values — rendered with bullet separators', control: 'text' },
      { name: 'dateTime', type: 'string', description: 'UTC datetime — split into date + time with bullet', control: 'text' },
      { name: 'containerStyle', type: 'object', description: 'Custom container styles' }
    ],
    relatedComponents: [],
    preview: { type: 'card', defaults: {} }
  },
  {
    name: 'MedicineCard',
    slug: 'medicine-card',
    description: 'Medicine card — icon in background box, CS/PR badges, name (bold 14px), description, and right-aligned pending count (zero-padded, bold).',
    category: 'view',
    path: 'src/views/utility/MedicineCard.js',
    props: [
      { name: 'name', type: 'string', description: 'Medicine name (bold 14px)', control: 'text' },
      { name: 'description', type: 'string', description: 'Description text (14px neutral)', control: 'text' },
      { name: 'pending', type: 'number', description: 'Pending items count — zero-padded 2 digits, bold' },
      { name: 'icon', type: 'string', description: 'Medicine icon URL (32x32 square avatar)' },
      { name: 'pendingColor', type: 'string', description: 'Color for pending count text', control: 'color' },
      { name: 'control_substance', type: "'0' | '1'", description: "Shows 'CS' badge when '1'" },
      { name: 'prescription_required', type: "'0' | '1'", description: "Shows 'PR' badge when '1'" }
    ],
    preview: { type: 'card', defaults: {} }
  },
  {
    name: 'PharmacyProductCard',
    slug: 'pharmacy-product-card',
    description: 'Pharmacy product card — square avatar (44px, 10px radius), CS/PR badges, title/subTitle/secondSubTitle with ellipsis and tooltips.',
    category: 'view',
    path: 'src/views/utility/PharmacyProductCard.js',
    props: [
      { name: 'title', type: 'string', description: 'Product name (bold 14px)', control: 'text' },
      { name: 'subTitle', type: 'string', description: 'Category/type text (14px neutral)', control: 'text' },
      { name: 'secondSubTitle', type: 'string', description: 'Dosage/detail text (14px neutral)', control: 'text' },
      { name: 'icon', type: 'string', description: 'Product icon URL' },
      { name: 'bgColor', type: 'string', description: 'Icon background color', control: 'color' },
      { name: 'onClick', type: '() => void', description: 'Card click handler' },
      { name: 'rowWidth', type: 'number', default: '250', description: 'Max width for text ellipsis' },
      { name: 'heoImageDimension', type: 'number', default: '44', description: 'Icon size in px' },
      { name: 'controlSubstance', type: 'boolean', default: 'false', description: "Shows 'CS' badge" },
      { name: 'prescriptionRequired', type: 'boolean', default: 'false', description: "Shows 'PR' badge" }
    ],
    preview: { type: 'card', defaults: {} }
  },
  {
    name: 'BottomActionBar',
    slug: 'bottom-action-bar',
    description: 'Fixed bottom action bar with primary/secondary action buttons.',
    category: 'view',
    path: 'src/views/utility/BottomActionBar.js',
    props: [
      { name: 'children', type: 'ReactNode', description: 'Action buttons content' }
    ],
    preview: { type: 'button', defaults: { title: 'Save Changes' } }
  },
  {
    name: 'DynamicBreadcrumbs',
    slug: 'dynamic-breadcrumbs',
    description: 'Auto-generated breadcrumb navigation based on current URL path.',
    category: 'view',
    path: 'src/views/utility/DynamicBreadcrumbs.js',
    props: [],
    preview: { type: 'generic', defaults: {} }
  },
  {
    name: 'HorizontalDateNav',
    slug: 'horizontal-date-nav',
    description: 'Horizontal date navigation/picker bar for day-by-day browsing.',
    category: 'view',
    path: 'src/views/utility/HorizontalDateNav.js',
    props: [
      { name: 'selectedDate', type: 'Date', description: 'Currently selected date' },
      { name: 'onChange', type: '(date) => void', description: 'Date change callback' }
    ],
    preview: { type: 'input', defaults: { label: 'Select Date' } }
  },
  {
    name: 'Search',
    slug: 'search',
    description: 'Reusable search input component with debounce and clear button.',
    category: 'view',
    path: 'src/views/utility/Search.js',
    props: [
      { name: 'value', type: 'string', description: 'Search query', control: 'text' },
      { name: 'onChange', type: '(value) => void', description: 'Search change callback' },
      { name: 'placeholder', type: 'string', description: 'Placeholder text', control: 'text' }
    ],
    preview: { type: 'input', defaults: { placeholder: 'Search animals...' } }
  },
  {
    name: 'FilterButtonWithNotification',
    slug: 'filter-button-notification',
    description: 'Filter button with active filter count badge notification.',
    category: 'view',
    path: 'src/views/utility/FilterButtonWithNotification.js',
    props: [
      { name: 'count', type: 'number', description: 'Active filter count' },
      { name: 'onClick', type: '() => void', description: 'Click handler' }
    ],
    preview: { type: 'button', defaults: { title: 'Filters' } }
  },
  {
    name: 'InfoDisplayGrid',
    slug: 'info-display-grid',
    description: 'Grid layout for displaying key-value information pairs.',
    category: 'view',
    path: 'src/views/utility/InfoDisplayGrid.js',
    props: [
      { name: 'data', type: 'Array<{label, value}>', description: 'Key-value pairs to display' }
    ],
    preview: { type: 'table', defaults: {} }
  },
  {
    name: 'FormFieldLabel',
    slug: 'form-field-label',
    description: 'Consistent form field label with optional required indicator.',
    category: 'view',
    path: 'src/views/utility/FormFieldLabel.js',
    props: [
      { name: 'label', type: 'string', description: 'Label text', control: 'text' },
      { name: 'required', type: 'boolean', description: 'Show required asterisk', control: 'boolean' }
    ],
    preview: { type: 'input', defaults: { label: 'Animal Name *' } }
  },
  {
    name: 'CustomAccordion',
    slug: 'custom-accordion',
    description: 'Expandable accordion sections for organizing grouped content.',
    category: 'view',
    path: 'src/views/utility/CustomAccordion.js',
    props: [
      { name: 'title', type: 'string', description: 'Accordion header text', control: 'text' },
      { name: 'children', type: 'ReactNode', description: 'Accordion content' },
      { name: 'defaultExpanded', type: 'boolean', default: 'false', description: 'Start expanded', control: 'boolean' }
    ],
    preview: { type: 'card', defaults: { message: 'Medical History (click to expand)' } }
  },
  {
    name: 'NoDataFound',
    slug: 'no-data-found',
    description: 'Empty state illustration — centered animal image (Meerkat, Seal, or Sloth variant) with configurable dimensions. No text, just the illustration.',
    category: 'view',
    path: 'src/views/utility/NoDataFound.js',
    props: [
      { name: 'variant', type: "'Meerkat' | 'Seal' | 'Sloth'", default: "'Meerkat'", description: 'Illustration variant — each is a different animal', control: 'select', options: ['Meerkat', 'Seal', 'Sloth'] },
      { name: 'height', type: 'number', default: '150', description: 'Image height in px' },
      { name: 'width', type: 'number', default: '150', description: 'Image width in px' }
    ],
    relatedComponents: ['empty-state-box', 'no-medical-data'],
    preview: { type: 'card', defaults: {} }
  },
  {
    name: 'NoMedicalData',
    slug: 'no-medical-data',
    description: 'Empty state specific to medical records — no prescriptions or history available.',
    category: 'view',
    path: 'src/views/utility/NoMedicalData.js',
    props: [],
    relatedComponents: ['no-data-found'],
    preview: { type: 'card', defaults: { message: 'No medical records available' } }
  },
  {
    name: 'SiteSectionEnclosureCard',
    slug: 'site-section-enclosure-card',
    description: 'Location hierarchy card showing Site > Section > Enclosure with icons.',
    category: 'view',
    path: 'src/views/utility/SiteSectionEnclosureCard.js',
    props: [
      { name: 'data', type: 'object', description: 'Location hierarchy data' }
    ],
    preview: { type: 'card', defaults: { message: 'Safari Zone > Big Cat Section > Tiger Enclosure A' } }
  },

  // ==================== UTILITIES ====================
  {
    name: 'formatDate',
    slug: 'format-date',
    description: 'Format date to YYYY-MM-DD format. Core date utility used across the app.',
    category: 'utility',
    path: 'src/utility/index.js',
    props: [
      { name: 'date', type: 'Date | string', description: 'Date to format' },
      { name: 'returns', type: 'string', description: 'Formatted date string (YYYY-MM-DD)' }
    ]
  },
  {
    name: 'convertUTCToLocal',
    slug: 'convert-utc-to-local',
    description: 'Convert UTC timestamp to local time with full datetime display.',
    category: 'utility',
    path: 'src/utility/index.js',
    props: [
      { name: 'utcDate', type: 'string', description: 'UTC date string' },
      { name: 'returns', type: 'string', description: 'Local datetime string' }
    ]
  },
  {
    name: 'formatAmountToReadableDigit',
    slug: 'format-amount-readable',
    description: 'Format number as Indian currency (₹) with comma-separated thousands.',
    category: 'utility',
    path: 'src/utility/index.js',
    props: [
      { name: 'amount', type: 'number', description: 'Amount to format' },
      { name: 'returns', type: 'string', description: 'Formatted currency string (e.g., ₹1,23,456)' }
    ]
  },
  {
    name: 'exportToCSV',
    slug: 'export-to-csv',
    description: 'Export table data to Excel/XLSX file with automatic download.',
    category: 'utility',
    path: 'src/utility/index.js',
    props: [
      { name: 'data', type: 'Array', description: 'Rows of data to export' },
      { name: 'columns', type: 'Array', description: 'Column definitions' },
      { name: 'filename', type: 'string', description: 'Output filename' }
    ]
  },
  {
    name: 'encrypt / decrypt',
    slug: 'crypto-storage',
    description: 'AES-256-GCM encryption/decryption with encrypted localStorage and cookie helpers.',
    category: 'utility',
    path: 'src/utility/cryptoStorage.js',
    props: [
      { name: 'encrypt(value)', type: 'string => string', description: 'Encrypt a value' },
      { name: 'decrypt(value)', type: 'string => string', description: 'Decrypt a value' },
      { name: 'setEncryptedItem(key, value)', type: 'void', description: 'Save to encrypted localStorage' },
      { name: 'getEncryptedItem(key)', type: 'any', description: 'Read from encrypted localStorage' }
    ]
  },
  {
    name: 'getDeviceInfo',
    slug: 'get-device-info',
    description: 'Get comprehensive device info: browser, OS, screen resolution, network type, device type.',
    category: 'utility',
    path: 'src/utility/deviceInfo.js',
    props: [
      { name: 'currentUserEmail', type: 'string', description: 'Current user email for device fingerprinting' },
      { name: 'returns', type: 'DeviceInfo', description: 'Device information object' }
    ]
  },
  {
    name: 'getLanguageConfig',
    slug: 'get-language-config',
    description: 'Get language configuration by code. Supports EN, FR, HI, AR with RTL detection.',
    category: 'utility',
    path: 'src/utility/localeConfig.js',
    props: [
      { name: 'code', type: 'string', description: 'Language code (en, fr, hi, ar)' },
      { name: 'returns', type: 'LanguageConfig', description: 'Language config with name, direction, locale' }
    ]
  },

  // ==================== CONTEXTS ====================
  {
    name: 'AuthContext',
    slug: 'auth-context',
    description: 'Authentication state provider — user info, login/logout, permissions, roles, modules access.',
    category: 'context',
    path: 'src/context/AuthContext.js',
    props: [
      { name: 'user', type: 'object | null', description: 'Current authenticated user' },
      { name: 'loading', type: 'boolean', description: 'Auth loading state' },
      { name: 'login', type: '(params) => Promise', description: 'Login function' },
      { name: 'logout', type: '() => void', description: 'Logout function' },
      { name: 'userData', type: 'object', description: 'Full user data with roles, permissions, modules' }
    ]
  },
  {
    name: 'AnimalContext',
    slug: 'animal-context',
    description: 'Selected animal state provider for cross-component animal data sharing.',
    category: 'context',
    path: 'src/context/AnimalContext.js',
    props: [
      { name: 'selectedAnimal', type: 'object | null', description: 'Currently selected animal' },
      { name: 'setSelectedAnimal', type: '(animal) => void', description: 'Set selected animal' }
    ]
  },
  {
    name: 'PharmacyContext',
    slug: 'pharmacy-context',
    description: 'Pharmacy module state — selected pharmacy, pharmacy list, and pharmacy-specific settings.',
    category: 'context',
    path: 'src/context/PharmacyContext.js',
    props: [
      { name: 'selectedPharmacy', type: 'object | null', description: 'Currently selected pharmacy' },
      { name: 'setSelectedPharmacy', type: '(pharmacy) => void', description: 'Set selected pharmacy' }
    ]
  },
  {
    name: 'HospitalContext',
    slug: 'hospital-context',
    description: 'Hospital/medical module state for inpatient, treatment, and discharge flows.',
    category: 'context',
    path: 'src/context/HospitalContext.js',
    props: [
      { name: 'hospitalData', type: 'object', description: 'Hospital state data' }
    ]
  },
  {
    name: 'EggContext',
    slug: 'egg-context',
    description: 'Egg management module state for incubation, collection, and nursery tracking.',
    category: 'context',
    path: 'src/context/EggContext.js',
    props: [
      { name: 'eggData', type: 'object', description: 'Egg management state' }
    ]
  }
]

export function getComponentBySlug(slug: string): ComponentEntry | undefined {
  return COMPONENT_REGISTRY.find(c => c.slug === slug)
}

export function getComponentsByCategory(category: string): ComponentEntry[] {
  if (category === 'all') return COMPONENT_REGISTRY
  return COMPONENT_REGISTRY.filter(c => c.category === category)
}

/** Returns a color key ('primary' | 'secondary' | 'tertiary'). Resolve via theme in component. */
export function getCategoryColorKey(category: string): string {
  const cat = CATEGORIES.find(c => c.key === category)
  return cat?.color ?? 'primary'
}

/** Resolve color key to actual hex from theme */
export function resolveColorKey(key: string, theme: any): string {
  if (key === 'primary') return theme.palette.primary.main
  if (key === 'secondary') return theme.palette.secondary.main
  if (key === 'tertiary') return theme.palette.customColors.Tertiary
  return theme.palette.primary.main
}

export function getCategoryLabel(category: string): string {
  const cat = CATEGORIES.find(c => c.key === category)
  return cat?.label ?? category
}
