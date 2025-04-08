import React, { useEffect, useState } from 'react';
import Jogo from './Jogo';

function FaseFinal({ jogos, onAtualizarPlacar, onFinalizarTorneio }) {
  const [jogosSubmetidos, setJogosSubmetidos] = useState(jogos);

  useEffect(() => {
    setJogosSubmetidos(jogos);
  }, [jogos]);

  const handleSubmitScore = (jogo, placar) => {
    if (typeof onAtualizarPlacar === 'function') {
      onAtualizarPlacar(jogo, placar);
      setJogosSubmetidos((prev) =>
        prev.map((j) => (j === jogo ? { ...j, placar, submetido: true } : j))
      );
    } else {
      console.error('onAtualizarPlacar não é uma função');
    }
  };

  return (
    <div>
      <h2>Fase Final</h2>
      {jogosSubmetidos.map((jogo, index) => (
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