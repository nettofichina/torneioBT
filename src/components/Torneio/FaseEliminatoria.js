import React, { useEffect, useState } from 'react';
import Jogo from './Jogo';

function FaseEliminatoria({ jogos, onAtualizarPlacar, onAvancarParaFinal }) {
  const [jogosSubmetidos, setJogosSubmetidos] = useState(jogos);

  useEffect(() => {
    setJogosSubmetidos(jogos);
  }, [jogos]);

  const handleSubmitScore = (jogo, placar) => {
    if (typeof onAtualizarPlacar === 'function') {
      onAtualizarPlacar(jogo, placar);

      const updatedJogos = jogosSubmetidos.map((j) =>
        j === jogo ? { ...j, placar, submetido: true } : j
      );
      setJogosSubmetidos(updatedJogos);

      if (updatedJogos.every((j) => j.submetido) && typeof onAvancarParaFinal === 'function') {
        onAvancarParaFinal(updatedJogos);
      }
    } else {
      console.error('onAtualizarPlacar não é uma função');
    }
  };

  return (
    <div>
      <h2>Fase Eliminatória</h2>
      {jogosSubmetidos.map((jogo, index) => (
        <div key={index}>
          <h3>{jogo.fase}</h3>
          <Jogo jogo={jogo} onSubmeterPlacar={handleSubmitScore} />
        </div>
      ))}
    </div>
  );
}

export default FaseEliminatoria;