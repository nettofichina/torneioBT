import React, { useState, useEffect } from 'react';

function Jogo({ jogo, onSubmeterPlacar }) {
  const [placar, setPlacar] = useState(jogo.placar);
  const [isSubmetido, setIsSubmetido] = useState(jogo.submetido);

  // Sincroniza o estado local com as props quando elas mudam
  useEffect(() => {
    setPlacar(jogo.placar);
    setIsSubmetido(jogo.submetido);
  }, [jogo.placar, jogo.submetido]);

  const handleSubmitScore = () => {
    if (placar && placar.match(/^\d+-\d+$/)) { // Verifica se é do tipo X-Y
      onSubmeterPlacar(jogo, placar);
      setIsSubmetido(true);
    } else {
      alert('Por favor, insira um placar válido no formato X-Y.');
    }
  };

  const handleEditScore = () => {
    setIsSubmetido(false);
  };

  return (
    <div className="jogo">
      <div className="dupla">{jogo.dupla1.join(' & ')} vs {jogo.dupla2.join(' & ')}</div>
      <div className="placar">
        {isSubmetido ? (
          <>
            <span>{placar}</span>
            <button onClick={handleEditScore}>Editar</button>
          </>
        ) : (
          <>
            <input 
              type="text" // Mudamos para text para maior controle
              inputMode="numeric" // Força teclado numérico
              pattern="[0-9-]*" // Restringe a números e hífen
              value={placar}
              onChange={(e) => setPlacar(e.target.value)}
              placeholder="Placar (ex: 3-2)"
            />
            <button onClick={handleSubmitScore}>Submeter Placar</button>
          </>
        )}
      </div>
    </div>
  );
}

export default Jogo;