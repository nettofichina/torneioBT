import React from 'react';

const DuplaItem = ({ dupla, index, onRemove }) => {
  return (
    <li onDoubleClick={onRemove}>
      Dupla {index + 1}: {dupla.join(' e ')}
    </li>
  );
};

export default DuplaItem;