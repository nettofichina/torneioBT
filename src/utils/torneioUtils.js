// src/utils/torneioUtils.js
export const classificarDuplas = (grupos) => {
  let classificados = [];

  grupos.forEach(grupo => {
    // Ordena duplas do grupo com base nos critérios de desempate
    const duplasClassificadas = classificarDuplasPorDesempate(grupo.duplas, grupo.jogos);

    // Adiciona os 2 melhores de cada grupo à lista de classificados
    classificados.push(duplasClassificadas[0], duplasClassificadas[1]);
  });

  console.log("Duplas classificadas para a fase eliminatória:", classificados);
  return classificados;
};

export const criarJogosParaGrupo = (duplas, grupoId) => {
  const jogos = [];
  for (let i = 0; i < duplas.length; i++) {
    for (let j = i + 1; j < duplas.length; j++) {
      jogos.push({
        dupla1: duplas[i],
        dupla2: duplas[j],
        placar: '',
        submetido: false,
        grupoId
      });
    }
  }
  return jogos;
};

export const dividirGrupos = (duplas) => {
  let numGrupos;
  // Forçar 2 grupos para 10 duplas
  if (duplas.length === 10) {
    numGrupos = 2;
  } else if (duplas.length <= 5) {
    numGrupos = 1;
  } else if (duplas.length <= 8) {
    numGrupos = 2;
  } else if (duplas.length <= 11) {
    numGrupos = 3;
  } else if (duplas.length <= 14) {
    numGrupos = 4;
  } else if (duplas.length <= 17) {
    numGrupos = 5;
  } else if (duplas.length <= 20) {
    numGrupos = 6;
  } else {
    numGrupos = Math.ceil(duplas.length / 3); // Para 21 ou mais
  }

  const grupos = Array(numGrupos).fill().map((_, i) => ({
    id: i,
    duplas: duplas.slice(i * Math.ceil(duplas.length / numGrupos), (i + 1) * Math.ceil(duplas.length / numGrupos))
  }));

  return grupos.filter(grupo => grupo.duplas.length > 0);
};

export const classificarDuplasPorDesempate = (duplas, jogos) => {
  const resultados = duplas.reduce((acc, dupla) => {
    if (!dupla || !Array.isArray(dupla) || dupla.length !== 2) {
      console.error('Dupla inválida:', dupla);
      return acc;
    }
    acc[dupla.join('')] = { dupla, pontos: 0, saldoGames: 0 };
    return acc;
  }, {});

  jogos.forEach(jogo => {
    if (jogo.placar && jogo.dupla1 && jogo.dupla2 && Array.isArray(jogo.dupla1) && Array.isArray(jogo.dupla2)) {
      const [games1, games2] = jogo.placar.split('-').map(Number);
      const chave1 = jogo.dupla1.join('');
      const chave2 = jogo.dupla2.join('');

      if (resultados[chave1] && resultados[chave2]) {
        if (games1 > games2) {
          resultados[chave1].pontos += 5;
          resultados[chave2].pontos += 2;
        } else {
          resultados[chave2].pontos += 5;
          resultados[chave1].pontos += 2;
        }
        resultados[chave1].saldoGames += games1 - games2;
        resultados[chave2].saldoGames += games2 - games1;
      } else {
        console.error('Dupla não encontrada em resultados:', { chave1, chave2, jogo });
      }
    } else {
      console.error('Jogo inválido ignorado:', jogo);
    }
  });

  return Object.values(resultados)
    .sort((a, b) => b.pontos - a.pontos || b.saldoGames - a.saldoGames)
    .map(r => r.dupla);
};

export const iniciarFaseEliminatoria = (classificados) => {
  let totalDuplas = classificados.length;
  let rodadas = Math.ceil(Math.log2(totalDuplas));
  // Ajusta o número de duplas para uma potência de 2 (adiciona BYEs se necessário)
  let proximoMultiplo = Math.pow(2, rodadas);
  let byes = proximoMultiplo - totalDuplas;
  let classificadosAjustados = [...classificados];
  for (let i = 0; i < byes; i++) {
    classificadosAjustados.push(['BYE', '']);
  }

  // Define o nome da fase com base na quantidade de rodadas:
  let faseNome;
  if (rodadas === 1) {
    faseNome = 'Final';
  } else if (rodadas === 2) {
    faseNome = 'Semifinal';
  } else if (rodadas === 3) {
    faseNome = 'Quartas de Final';
  } else {
    faseNome = `Rodada 1`;
  }

  // Gera apenas a primeira rodada:
  let jogosRodada = [];
  for (let i = 0; i < classificadosAjustados.length; i += 2) {
    jogosRodada.push({
      dupla1: classificadosAjustados[i],
      dupla2: classificadosAjustados[i + 1],
      placar: '',
      submetido: false,
      fase: faseNome,
      rodada: 1
    });
  }
  return jogosRodada;
};

export const avancarRodadaEliminatoria = (jogosRodadaAtual) => {
  let vencedores = jogosRodadaAtual.map(jogo => {
    const [score1, score2] = jogo.placar.split('-').map(Number);
    if (jogo.dupla2[0] === 'BYE') return jogo.dupla1;
    return score1 > score2 ? jogo.dupla1 : jogo.dupla2;
  });

  let rodadasTotal = Math.ceil(Math.log2(vencedores.length));
  let novaFaseNome = ['Final', 'Semifinal', 'Quartas de Final'][rodadasTotal - 1] || `Rodada ${jogosRodadaAtual[0].rodada + 1}`;

  let novaRodada = [];
  for (let i = 0; i < vencedores.length; i += 2) {
    if (vencedores[i + 1]) {
      novaRodada.push({
        dupla1: vencedores[i],
        dupla2: vencedores[i + 1],
        placar: '',
        submetido: false,
        fase: novaFaseNome,
        rodada: jogosRodadaAtual[0].rodada + 1
      });
    } else {
      // Caso seja um número ímpar, adiciona um BYE
      novaRodada.push({
        dupla1: vencedores[i],
        dupla2: ['BYE', ''], 
        placar: '',
        submetido: false,
        fase: novaFaseNome,
        rodada: jogosRodadaAtual[0].rodada + 1
      });
    }
  }
  return novaRodada;
};

