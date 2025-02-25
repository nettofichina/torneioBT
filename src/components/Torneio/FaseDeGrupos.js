// FaseDeGrupos.js
import React from 'react';
import Jogo from './Jogo';

function FaseDeGrupos({ grupos, onUpdateGroups }) {
  const handleSubmitScore = (jogo, placar) => {
    const newGrupos = grupos.map(grupo => {
      if (grupo.id === jogo.grupoId) {
        return {
          ...grupo,
          jogos: grupo.jogos.map(j =>
            (j.dupla1 === jogo.dupla1 && j.dupla2 === jogo.dupla2) ||
            (j.dupla1 === jogo.dupla2 && j.dupla2 === jogo.dupla1)
              ? { ...j, placar, submetido: true }
              : j
          )
        };
      }
      return grupo;
    });
    onUpdateGroups(newGrupos);
  };

  return (
    <div>
      {grupos.map(grupo => (
        <div key={`grupo-${grupo.id}`}>
          <h3>Grupo {grupo.id + 1} ({grupo.duplas.length} duplas)</h3>
          <ul className="group-duplas"> {/* Adiciona a classe group-duplas */}
            {grupo.duplas.map((dupla, index) => (
              <li key={`dupla-${grupo.id}-${index}`}>{dupla.join(' & ')}</li>
            ))}
          </ul>
          {grupo.jogos.map((jogo, index) => (
            <Jogo
              key={`jogo-${grupo.id}-${index}`}
              jogo={jogo}
              onSubmeterPlacar={handleSubmitScore}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export default FaseDeGrupos;