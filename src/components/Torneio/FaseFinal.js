import React from 'react';
import Jogo from './Jogo';

function FaseFinal({ jogos, onAtualizarPlacar, onFinalizarTorneio }) {
  const handleSubmitScore = (jogo, placar) => {
    if (typeof onAtualizarPlacar === 'function') {
      onAtualizarPlacar(jogo, placar);

      // Verifica se todos os jogos da fase final foram submetidos
      if (jogos.every(j => j.submetido)) {
        if (typeof onFinalizarTorneio === 'function') {
          onFinalizarTorneio();
        }
      }
    } else {
      console.error('onAtualizarPlacar não é uma função');
    }
  };

  return (
    <div>
      <h2>Fase Final</h2>
      {jogos.map((jogo, index) => (
        <div key={index}>
          <h3>{jogo.fase}</h3>
          <Jogo 
            jogo={jogo} 
            onSubmeterPlacar={handleSubmitScore}
          />
        </div>
      ))}
    </div>
  );
}

export default FaseFinal;