import React from 'react';
import Jogo from './Jogo';

function FaseEliminatoria({ jogos, onAtualizarPlacar, onAvancarParaFinal }) {
  // Certifique-se de que onAtualizarPlacar existe antes de usá-lo
  const handleSubmitScore = (jogo, placar) => {
    if (typeof onAtualizarPlacar === 'function') {
      onAtualizarPlacar(jogo, placar);
      
      // Verifica se todos os jogos da fase eliminatória foram submetidos
      if (jogos.every(j => j.submetido)) {
        if (typeof onAvancarParaFinal === 'function') {
          onAvancarParaFinal(jogos);
        }
      }
    } else {
      console.error('onAtualizarPlacar não é uma função');
    }
  };

  return (
    <div>
      <h2>Fase Eliminatória</h2>
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

export default FaseEliminatoria;