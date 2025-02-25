import React, { forwardRef } from 'react';

const Input = forwardRef(({ type = 'text', placeholder, ...props }, ref) => (
  <input
    type={type}
    placeholder={placeholder}
    ref={ref} // Passar o ref para o input
    {...props}
  />
));

export default Input;