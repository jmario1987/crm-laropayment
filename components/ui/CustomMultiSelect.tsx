// src/components/ui/CustomMultiSelect.tsx

import React from 'react';
import { components, OptionProps, ValueContainerProps } from 'react-select';

export const OptionWithCheckbox = (props: OptionProps<any, true>) => {
  return (
    <div>
      <components.Option {...props}>
        <input type="checkbox" checked={props.isSelected} onChange={() => null} className="mr-2" />
        <label>{props.label}</label>
      </components.Option>
    </div>
  );
};

export const CustomValueContainer = ({ children, ...props }: ValueContainerProps<any, true>) => {
  const { hasValue, selectProps } = props;
  const count = props.getValue().length;

  if (!hasValue) {
    return (
      <components.ValueContainer {...props}>
        {children}
      </components.ValueContainer>
    );
  }

  return (
    <components.ValueContainer {...props}>
      {`${count} de ${selectProps.options.length} seleccionados`}
    </components.ValueContainer>
  );
};