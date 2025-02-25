import React, { useState } from 'react';
import personAddIcon from '../../assets/icons/person_add.svg'; // Importa ícone adicionar dupla
import groupRemoveIcon from '../../assets/icons/group_remove.svg'; // Importa ícone remover

function DuplasList({ duplas, onAddDupla, onRemoveDupla }) {
  const [newDupla, setNewDupla] = useState(['', '']);

  const handleAddDupla = () => {
    if (newDupla[0] && newDupla[1]) {
      // Converte para maiúsculas antes de adicionar
      const duplaMaiuscula = [newDupla[0].toUpperCase(), newDupla[1].toUpperCase()];
      onAddDupla(duplaMaiuscula);
      setNewDupla(['', '']);
    } else {
      alert('Por favor, preencha ambos os nomes dos jogadores.');
    }
  };

  return (
    <div className="duplas-lista">
      <h2>Insira os jogadores:</h2>
      <div className="dupla-inputs">
        <div className="input-container">
          <input
            type="text"
            value={newDupla[0]}
            onChange={(e) => setNewDupla([e.target.value.toUpperCase(), newDupla[1]])}
            placeholder="Jogador 1"
          />
        </div>
        <div className="input-container">
          <input
            type="text"
            value={newDupla[1]}
            onChange={(e) => setNewDupla([newDupla[0], e.target.value.toUpperCase()])}
            placeholder="Jogador 2"
          />
        </div>
        <button className="adicionar-dupla" onClick={handleAddDupla}>
          <img src={personAddIcon} alt="Person Add Icon" className="button-icon" />
          Adicionar Dupla
        </button>
      </div>
      {duplas.length > 0 && <h2>Duplas</h2>}
      <ul className="duplas-list-grid">
        {duplas.map((dupla, index) => (
          <li key={index} className="dupla-item">
            <span className="dupla-text">
              <strong>Dupla {index + 1}:</strong> {dupla.join(' & ')}
            </span>
            <button className="remover" onClick={() => onRemoveDupla(index)}>
              <img src={groupRemoveIcon} alt="Group Remove Icon" className="button-icon" />
              Remover
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default DuplasList;