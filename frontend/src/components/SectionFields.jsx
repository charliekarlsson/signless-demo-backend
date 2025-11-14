import React from 'react';
import { getValueAtPath } from '../utils/objectPath';

const Field = ({ field, value, onChange }) => {
  const handleChange = (event) => {
    switch (field.type) {
      case 'number':
        onChange(field.path, event.target.value === '' ? '' : Number(event.target.value));
        break;
      case 'toggle':
        onChange(field.path, event.target.checked);
        break;
      default:
        onChange(field.path, event.target.value);
    }
  };

  if (field.type === 'textarea') {
    return (
      <label className="field" key={field.path}>
        <span className="field-label">{field.label}</span>
        {field.helper && <span className="field-helper">{field.helper}</span>}
        <textarea
          rows={field.rows ?? 3}
          placeholder={field.placeholder}
          value={value ?? ''}
          onChange={handleChange}
        />
      </label>
    );
  }

  if (field.type === 'select') {
    return (
      <label className="field" key={field.path}>
        <span className="field-label">{field.label}</span>
        {field.helper && <span className="field-helper">{field.helper}</span>}
  <select value={value ?? field.options?.[0]?.value ?? ''} onChange={handleChange}>
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (field.type === 'toggle') {
    return (
      <label className="field toggle" key={field.path}>
        <div>
          <span className="field-label">{field.label}</span>
          {field.helper && <span className="field-helper">{field.helper}</span>}
        </div>
        <div className="switch">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={handleChange}
            aria-label={field.label}
          />
          <span className="switch-slider" />
        </div>
      </label>
    );
  }

  return (
    <label className="field" key={field.path}>
      <span className="field-label">{field.label}</span>
      {field.helper && <span className="field-helper">{field.helper}</span>}
      <input
        type={field.type === 'color' ? 'color' : field.type === 'number' ? 'number' : 'text'}
        value={value ?? ''}
        onChange={handleChange}
        placeholder={field.placeholder}
        step={field.step}
        min={field.min}
        max={field.max}
      />
    </label>
  );
};

const SectionFields = ({ section, config, onChange }) => (
  <div className="config-section">
    <div className="section-header">
      <h2>{section.title}</h2>
      <p>{section.description}</p>
    </div>
    <div className="fields-grid">
      {section.fields?.map((field) => (
        <Field
          key={field.path}
          field={field}
          value={getValueAtPath(config, field.path)}
          onChange={onChange}
        />
      ))}
    </div>
  </div>
);

export default SectionFields;
