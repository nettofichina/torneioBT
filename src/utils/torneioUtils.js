// src/utils/torneioUtils.js

export const classificarDuplasPorDesempate = (duplas, jogos) => {
  const resultados = duplas.reduce((acc, dupla) => {
    if (!dupla || !Array.isArray(dupla) || dupla.length !== 2) {
      console.error('Dupla inválida:', dupla);
      return acc;
    }
    acc[dupla.join('')] = { dupla, pontos: 0, saldoGames: 0 };
    return acc;
  }, {});

  jogos.forEach((jogo) => {
    if (
      jogo.placar &&
      typeof jogo.placar === 'string' &&
      jogo.placar.includes('-') &&
      jogo.dupla1 &&
      jogo.dupla2 &&
      Array.isArray(jogo.dupla1) &&
      Array.isArray(jogo.dupla2)
    ) {
      const [games1, games2] = jogo.placar.split('-').map(Number);
      if (isNaN(games1) || isNaN(games2)) {
        console.error('Placar inválido ignorado:', jogo);
        return;
      }
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
      console.error('Jogo inválido ignorado (detalhes):', JSON.stringify(jogo));
    }
  });

  return Object.values(resultados)
    .sort((a, b) => b.pontos - a.pontos || b.saldoGames - a.saldoGames)
    .map((r) => r.dupla);
};

// Demais funções permanecem iguais (criarJogosParaGrupo, dividirGrupos, etc.)
export const criarJogosParaGrupo = (duplas, grupoId) => {
  const jogos = [];
  for (let i = 0; i < duplas.length; i++) {
    for (let j = i + 1; j < duplas.length; j++) {
      jogos.push({
        dupla1: duplas[i],
        dupla2: duplas[j],
        placar: '',
        submetido: false,
        grupoId,
      });
    }
  }
  return jogos;
};

export const dividirGrupos = (duplas) => {
  let numGrupos;
  let grupos;

  if (duplas.length === 10) {
    numGrupos = 2; // Mantém padrão
  } else if (duplas.length === 14) {
    numGrupos = 4; // 14 duplas: 2 grupos de 4, 2 grupos de 3
    grupos = [
      { id: 0, duplas: duplas.slice(0, 4) },   // 4 duplas
      { id: 1, duplas: duplas.slice(4, 8) },   // 4 duplas
      { id: 2, duplas: duplas.slice(8, 11) },  // 3 duplas
      { id: 3, duplas: duplas.slice(11, 14) }, // 3 duplas
    ];
  } else if (duplas.length <= 5) {
    numGrupos = 1;
  } else if (duplas.length <= 8) {
    numGrupos = 2;
  } else if (duplas.length <= 11) {
    numGrupos = 3;
  } else if (duplas.length <= 17) {
    numGrupos = 5;
  } else if (duplas.length <= 20) {
    numGrupos = 6;
  } else {
    numGrupos = Math.ceil(duplas.length / 3);
  }

  if (!grupos) {
    grupos = Array(numGrupos)
      .fill()
      .map((_, i) => ({
        id: i,
        duplas: duplas.slice(
          i * Math.ceil(duplas.length / numGrupos),
          (i + 1) * Math.ceil(duplas.length / numGrupos)
        ),
      }));
  }

  return grupos.filter((grupo) => grupo.duplas.length > 0);
};

export const classificarDuplas = (grupos) => {
  let classificados = [];
  grupos.forEach((grupo) => {
    const duplasClassificadas = classificarDuplasPorDesempate(grupo.duplas, grupo.jogos);
    classificados.push(
      { dupla: duplasClassificadas[0], grupoId: grupo.id }, // 1º do grupo
      { dupla: duplasClassificadas[1], grupoId: grupo.id }  // 2º do grupo
    );
  });
  console.log('Duplas classificadas para a fase eliminatória:', classificados);
  return classificados;
};

export const iniciarFaseEliminatoria = (classificados) => {
  let totalDuplas = classificados.length; // 8
  let rodadas = Math.ceil(Math.log2(totalDuplas)); // 3
  let proximoMultiplo = Math.pow(2, rodadas); // 8
  let byes = proximoMultiplo - totalDuplas; // 0
  let classificadosAjustados = [...classificados];

  // Separar primeiros e segundos colocados
  const primeiros = classificadosAjustados.filter((c, i) => i % 2 === 0); // 1º de cada grupo
  const segundos = classificadosAjustados.filter((c, i) => i % 2 === 1);  // 2º de cada grupo

  // Embaralhar para variar os cruzamentos
  const shuffleArray = (array) => array.sort(() => Math.random() - 0.5);
  const primeirosShuffled = shuffleArray([...primeiros]);
  const segundosShuffled = shuffleArray([...segundos]);

  // Criar jogos garantindo que duplas do mesmo grupo não se enfrentem
  let jogosRodada = [];
  for (let i = 0; i < primeirosShuffled.length; i++) {
    const primeiro = primeirosShuffled[i];
    const segundo = segundosShuffled[i];
    if (primeiro.grupoId === segundo.grupoId) {
      // Troca o segundo com o próximo disponível de grupo diferente
      const swapIndex = (i + 1) % segundosShuffled.length;
      segundosShuffled[i] = segundosShuffled[swapIndex];
      segundosShuffled[swapIndex] = segundo;
    }
    jogosRodada.push({
      dupla1: primeiro.dupla,
      dupla2: segundosShuffled[i].dupla,
      placar: '',
      submetido: false,
      fase: totalDuplas <= 2 ? 'Final' : totalDuplas <= 4 ? 'Semifinal' : totalDuplas <= 8 ? 'Quartas de Final' : 'Oitavas de Final',
      rodada: 1,
    });
  }

  // Adicionar BYEs, se necessário (não aplica para 8 duplas)
  for (let i = 0; i < byes; i++) {
    jogosRodada.push({
      dupla1: classificadosAjustados[classificadosAjustados.length - byes + i].dupla,
      dupla2: ['BYE', ''],
      placar: '',
      submetido: false,
      fase: totalDuplas <= 2 ? 'Final' : totalDuplas <= 4 ? 'Semifinal' : totalDuplas <= 8 ? 'Quartas de Final' : 'Oitavas de Final',
      rodada: 1,
    });
  }

  return jogosRodada;
};

export const avancarRodadaEliminatoria = (jogosRodadaAtual) => {
  let vencedores = jogosRodadaAtual.map((jogo) => {
    const [score1, score2] = jogo.placar.split('-').map(Number);
    if (jogo.dupla2[0] === 'BYE') return jogo.dupla1;
    return score1 > score2 ? jogo.dupla1 : jogo.dupla2;
  });

  let rodadasTotal = Math.ceil(Math.log2(vencedores.length));
  let novaFaseNome =
    ['Final', 'Semifinal', 'Quartas de Final'][rodadasTotal - 1] ||
    `Rodada ${jogosRodadaAtual[0].rodada + 1}`;

  let novaRodada = [];
  for (let i = 0; i < vencedores.length; i += 2) {
    if (vencedores[i + 1]) {
      novaRodada.push({
        dupla1: vencedores[i],
        dupla2: vencedores[i + 1],
        placar: '',
        submetido: false,
        fase: novaFaseNome,
        rodada: jogosRodadaAtual[0].rodada + 1,
      });
    } else {
      novaRodada.push({
        dupla1: vencedores[i],
        dupla2: ['BYE', ''],
        placar: '',
        submetido: false,
        fase: novaFaseNome,
        rodada: jogosRodadaAtual[0].rodada + 1,
      });
    }
  }
  return novaRodada;
};

export const generateTournament = (nome, duplas, dataInicio, horaInicio) => {
  if (duplas.length < 3) {
    throw new Error('É necessário pelo menos 3 duplas para criar um torneio.');
  }
  if (!nome || !dataInicio || !horaInicio) {
    throw new Error('Nome, data e hora de início são obrigatórios.');
  }

  const tournaments = loadTournaments();
  if (tournaments[nome]) {
    throw new Error('Já existe um torneio com esse nome. Escolha outro nome.');
  }

  const duplasSorteadas = [...duplas].sort(() => Math.random() - 0.5);
  const gruposCriados = dividirGrupos(duplasSorteadas);
  const gruposComJogos = gruposCriados.map((grupo) => ({
    ...grupo,
    jogos: criarJogosParaGrupo(grupo.duplas, grupo.id),
  }));

  const [ano, mes, dia] = dataInicio.split('-').map(Number);
  const [hora, minuto] = horaInicio.split(':').map(Number);
  const dataTorneio = new Date(ano, mes - 1, dia, hora, minuto).toISOString();

  const tournament = {
    nome,
    dataCriacao: new Date().toISOString(),
    dataTorneio,
    dataInicio,
    horaInicio,
    duplas: duplasSorteadas,
    grupos: gruposComJogos,
    jogosEliminatoria: [],
    finalConfigurada: false,
    terceiroLugarConfigurado: false,
    ranking: [],
    duplasBye: [],
    historicoDuplas: duplasSorteadas.reduce((acc, dupla) => {
      acc[dupla.join('')] = {
        dupla,
        pontos: 0,
        jogos: 0,
        jogosVencidos: 0,
        gamesVencidos: 0,
        gamesPerdidos: 0,
      };
      return acc;
    }, {}),
    status: 'rascunho',
    faseAtual: 'duplas',
  };

  saveTournament(tournament);
  return tournament;
};

export const saveTournament = (tournamentData) => {
  const tournaments = JSON.parse(localStorage.getItem('tournaments') || '{}');
  tournaments[tournamentData.nome] = tournamentData;
  localStorage.setItem('tournaments', JSON.stringify(tournaments));
};

export const loadTournaments = () => {
  return JSON.parse(localStorage.getItem('tournaments') || '{}');
};

export const deleteTournament = (nome) => {
  const tournaments = JSON.parse(localStorage.getItem('tournaments') || '{}');
  delete tournaments[nome];
  localStorage.setItem('tournaments', JSON.stringify(tournaments));
};