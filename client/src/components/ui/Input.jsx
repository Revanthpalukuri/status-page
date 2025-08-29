import React from 'react';

const Input = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder = '',
  disabled = false,
  required = false,
  error = '',
  help = '',
  className = '',
  ...props
}) => {
  const inputClasses = `
    form-input
    ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
    ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}
    ${className}
  `;

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={name} className="form-label">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={inputClasses}
        {...props}
      />
      {error && <p className="form-error">{error}</p>}
      {help && !error && <p className="text-gray-500 text-sm mt-1">{help}</p>}
    </div>
  );
};

export default Input;
