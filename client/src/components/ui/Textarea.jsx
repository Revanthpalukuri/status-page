import React from 'react';

const Textarea = ({
  label,
  name,
  value,
  onChange,
  placeholder = '',
  disabled = false,
  required = false,
  error = '',
  rows = 4,
  className = '',
  ...props
}) => {
  const textareaClasses = `
    form-input
    resize-vertical
    ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
    ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}
    ${className}
  `;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={name} className="form-label">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        rows={rows}
        className={textareaClasses}
        {...props}
      />
      {error && <p className="form-error">{error}</p>}
    </div>
  );
};

export default Textarea;