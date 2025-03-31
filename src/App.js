import React, { useState, useEffect } from 'react';
import DuplasList from './components/Duplas/DuplasList';
import FaseDeGrupos from './components/Torneio/FaseDeGrupos';
import FaseEliminatoria from './components/Torneio/FaseEliminatoria';
import FaseFinal from './components/Torneio/FaseFinal';
import MeusTorneios from './components/Torneio/MeusTorneios';
import {
  saveTournament,
  loadTournaments,
  deleteTournament,
  generateTournament,
  classificarDuplasPorDesempate,
} from './utils/torneioUtils';
import './App.css';
import gameDay from './assets/img/game-day.svg';
import btConnectLogo from './assets/img/btConnect.png';
import tournamentsIcon from './assets/icons/tournaments.svg';
import shuffleIcon from './assets/icons/shuffle.svg';
import folderIcon from './assets/icons/folder.svg';

function App() {
  const [currentTournament, setCurrentTournament] = useState(null);
  const [faseAtual, setFaseAtual] = useState('menu');
  const [tournaments, setTournaments] = useState(loadTournaments());

  useEffect(() => {
    const updatedTournaments = loadTournaments();
    setTournaments(updatedTournaments);
  }, []);

  const loadTournament = (nome) => {
    const tournament = tournaments[nome];
    if (tournament) {
      console.log('Carregando torneio do localStorage:', tournament);
      setCurrentTournament(tournament);
      setFaseAtual(tournament.status === 'finalizado' ? 'finalizado' : tournament.faseAtual || 'duplas');
    } else {
      createNewTournament();
    }
  };

  const saveCurrentTournament = () => {
    if (currentTournament && currentTournament.nome && currentTournament.dataInicio && currentTournament.horaInicio) {
      const tournamentToSave = { ...currentTournament, faseAtual };
      console.log('Salvando torneio no localStorage:', tournamentToSave);
      saveTournament(tournamentToSave);
      setTournaments(loadTournaments());
    }
  };

  const updateTournamentField = (field, value) => {
    setCurrentTournament((prev) => {
      const updated = { ...prev, [field]: value };
      console.log(`Atualizando ${field}:`, value);
      if (updated.nome && updated.dataInicio && updated.horaInicio) {
        saveCurrentTournament();
      }
      return updated;
    });
  };

  const createNewTournament = () => {
    const newTournament = {
      nome: '',
      dataCriacao: null,
      dataTorneio: null,
      dataInicio: '',
      horaInicio: '',
      duplas: [],
      grupos: [],
      jogosEliminatoria: [],
      finalConfigurada: false,
      terceiroLugarConfigurado: false,
      ranking: [],
      duplasBye: [],
      historicoDuplas: {},
      status: 'rascunho',
      faseAtual: 'duplas',
    };
    setCurrentTournament(newTournament);
    setFaseAtual('duplas');
  };

  const handleDeleteTournament = (nome) => {
    deleteTournament(nome);
    setTournaments((prev) => {
      const updated = { ...prev };
      delete updated[nome];
      return updated;
    });
    if (currentTournament && currentTournament.nome === nome) {
      setCurrentTournament(null);
      setFaseAtual('menu');
    }
  };

  // Função para importar torneios
  const handleImportTournaments = (importedTournaments) => {
    setTournaments((prev) => {
      const updatedTournaments = { ...prev, ...importedTournaments };
      Object.entries(updatedTournaments).forEach(([nome, tournament]) => {
        saveTournament(tournament);
      });
      return updatedTournaments;
    });
  };

  const addDupla = (dupla) => {
    if (
      !currentTournament?.duplas.some(
        (d) => d.includes(dupla[0]) || d.includes(dupla[1])
      )
    ) {
      updateTournamentField('duplas', [...currentTournament.duplas, dupla]);
    } else {
      alert('Os nomes dos jogadores devem ser únicos.');
    }
  };

  const removeDupla = (index) => {
    updateTournamentField(
      'duplas',
      currentTournament.duplas.filter((_, i) => i !== index)
    );
  };

  const startTournament = () => {
    if (currentTournament.duplas.length < 3) {
      alert('É necessário pelo menos 3 duplas para começar o torneio.');
      return;
    }
    if (
      !currentTournament.nome ||
      !currentTournament.dataInicio ||
      !currentTournament.horaInicio
    ) {
      alert('Preencha o nome, data e hora de início do torneio.');
      return;
    }
    const duplasSorteadas = [...currentTournament.duplas].sort(() => Math.random() - 0.5);
    const historicoInicial = duplasSorteadas.reduce((acc, dupla) => {
      acc[dupla.join('')] = { dupla, pontos: 0, jogos: 0, jogosVencidos: 0, gamesVencidos: 0, gamesPerdidos: 0 };
      return acc;
    }, {});
    setCurrentTournament((prev) => ({
      ...prev,
      historicoDuplas: historicoInicial,
      status: 'em andamento',
      dataCriacao: new Date().toISOString(),
      duplas: duplasSorteadas,
    }));
    setFaseAtual('grupos');
    saveCurrentTournament();
  };

  const encerrarFaseGrupos = () => {
    if (
      currentTournament.grupos.some((grupo) =>
        grupo.jogos.some((jogo) => !jogo.submetido)
      )
    ) {
      alert(
        'Todos os jogos devem ser submetidos antes de encerrar a fase de grupos.'
      );
      return;
    }

    const todosOsJogos = currentTournament.grupos.flatMap((grupo) => grupo.jogos);
    console.log('Jogos da fase de grupos:', todosOsJogos);
    updateTournamentField('historicoDuplas', (prev) => {
      const novoHistorico = { ...prev };
      todosOsJogos.forEach((jogo) => {
        if (!jogo.placar || !jogo.placar.includes('-')) return;
        const [g1, g2] = jogo.placar.split('-').map(Number);
        if (isNaN(g1) || isNaN(g2)) return;
        const chave1 = jogo.dupla1.join('');
        const chave2 = jogo.dupla2.join('');
        if (!novoHistorico[chave1])
          novoHistorico[chave1] = {
            dupla: jogo.dupla1,
            pontos: 0,
            jogos: 0,
            jogosVencidos: 0,
            gamesVencidos: 0,
            gamesPerdidos: 0,
          };
        if (!novoHistorico[chave2])
          novoHistorico[chave2] = {
            dupla: jogo.dupla2,
            pontos: 0,
            jogos: 0,
            jogosVencidos: 0,
            gamesVencidos: 0,
            gamesPerdidos: 0,
          };
        novoHistorico[chave1].jogos += 1;
        novoHistorico[chave2].jogos += 1;
        if (g1 > g2) {
          novoHistorico[chave1].pontos += 5;
          novoHistorico[chave1].jogosVencidos += 1;
          novoHistorico[chave1].gamesVencidos += g1;
          novoHistorico[chave1].gamesPerdidos += g2;
          novoHistorico[chave2].pontos += 2;
          novoHistorico[chave2].gamesVencidos += g2;
          novoHistorico[chave2].gamesPerdidos += g1;
        } else {
          novoHistorico[chave2].pontos += 5;
          novoHistorico[chave2].jogosVencidos += 1;
          novoHistorico[chave2].gamesVencidos += g2;
          novoHistorico[chave2].gamesPerdidos += g1;
          novoHistorico[chave1].pontos += 2;
          novoHistorico[chave1].gamesVencidos += g1;
          novoHistorico[chave1].gamesPerdidos += g2;
        }
      });
      console.log('Histórico após fase de grupos:', novoHistorico);
      return novoHistorico;
    });

    const numDuplas = currentTournament.duplas.length;

    if (numDuplas <= 5) {
      const classificados = classificarDuplasPorDesempate(
        currentTournament.duplas,
        todosOsJogos
      );
      updateTournamentField('ranking', [
        { lugar: 1, dupla: classificados[0] },
        { lugar: 2, dupla: classificados[1] },
        { lugar: 3, dupla: classificados[2] || ['N/A', 'N/A'] },
      ]);
      updateTournamentField('status', 'finalizado');
      setFaseAtual('finalizado');
    } else if (numDuplas === 9 || numDuplas === 10) {
      const rankingGrupo1 = classificarDuplasPorDesempate(
        currentTournament.grupos[0].duplas,
        currentTournament.grupos[0].jogos
      );
      const rankingGrupo2 = classificarDuplasPorDesempate(
        currentTournament.grupos[1].duplas,
        currentTournament.grupos[1].jogos
      );
      const semifinalMatches = [
        {
          dupla1: [...rankingGrupo1[0]],
          dupla2: [...rankingGrupo2[1]],
          placar: '',
          submetido: false,
          fase: 'Semifinal',
          rodada: 1,
        },
        {
          dupla1: [...rankingGrupo2[0]],
          dupla2: [...rankingGrupo1[1]],
          placar: '',
          submetido: false,
          fase: 'Semifinal',
          rodada: 1,
        },
      ];
      updateTournamentField('jogosEliminatoria', semifinalMatches);
      setFaseAtual('eliminatória');
    } else {
      const classificadosPorGrupo = currentTournament.grupos
        .map((grupo) => classificarDuplasPorDesempate(grupo.duplas, grupo.jogos).slice(0, 2))
        .flat();
      const duplasUnicas = classificadosPorGrupo.filter(
        (dupla, index, self) =>
          index === self.findIndex((d) => d.join('') === dupla.join(''))
      );
      const jogosClassificados = todosOsJogos.filter((jogo) => {
        const dupla1Str = jogo.dupla1.join('');
        const dupla2Str = jogo.dupla2.join('');
        return (
          duplasUnicas.some((d) => d.join('') === dupla1Str) &&
          duplasUnicas.some((d) => d.join('') === dupla2Str)
        );
      });
      const rankingGeral = classificarDuplasPorDesempate(duplasUnicas, jogosClassificados);

      if (numDuplas <= 11) {
        if (rankingGeral.length < 6) {
          if (rankingGeral.length === 2) {
            updateTournamentField('jogosEliminatoria', [
              {
                dupla1: [...rankingGeral[0]],
                dupla2: [...rankingGeral[1]],
                placar: '',
                submetido: false,
                fase: 'Final',
                rodada: 1,
              },
            ]);
            setFaseAtual('final');
          } else if (rankingGeral.length <= 4) {
            updateTournamentField('jogosEliminatoria', [
              {
                dupla1: [...rankingGeral[0]],
                dupla2: [...rankingGeral[1]],
                placar: '',
                submetido: false,
                fase: 'Semifinal',
                rodada: 1,
              },
              {
                dupla1: [...rankingGeral[2]],
                dupla2: rankingGeral[3] ? [...rankingGeral[3]] : ['BYE', ''],
                placar: '',
                submetido: false,
                fase: 'Semifinal',
                rodada: 1,
              },
            ]);
            setFaseAtual('eliminatória');
          } else {
            const duplasByeLocal = rankingGeral.slice(0, 2);
            const duplasSemifinais = rankingGeral.slice(2, 4);
            updateTournamentField('jogosEliminatoria', [
              {
                dupla1: [...duplasSemifinais[0]],
                dupla2: duplasSemifinais[1] ? [...duplasSemifinais[1]] : ['BYE', ''],
                placar: '',
                submetido: false,
                fase: 'Semifinal',
                rodada: 1,
              },
            ]);
            updateTournamentField('duplasBye', duplasByeLocal);
            setFaseAtual('eliminatória');
          }
        } else {
          const duplasByeLocal = rankingGeral.slice(0, 2);
          const duplasQuartas = rankingGeral.slice(2, 6);
          const jogosQuartas = [
            {
              dupla1: [...duplasQuartas[0]],
              dupla2: [...duplasQuartas[1]],
              placar: '',
              submetido: false,
              fase: 'Quartas de Final',
              rodada: 1,
            },
            {
              dupla1: [...duplasQuartas[2]],
              dupla2: [...duplasQuartas[3]],
              placar: '',
              submetido: false,
              fase: 'Quartas de Final',
              rodada: 1,
            },
          ];
          updateTournamentField('jogosEliminatoria', jogosQuartas);
          updateTournamentField('duplasBye', duplasByeLocal);
          setFaseAtual('eliminatória');
        }
      } else {
        const top16 = rankingGeral.slice(0, 16);
        const jogosOitavas = [];
        for (let i = 0; i < top16.length; i += 2) {
          jogosOitavas.push({
            dupla1: [...top16[i]],
            dupla2: top16[i + 1] ? [...top16[i + 1]] : ['BYE', ''],
            placar: '',
            submetido: false,
            fase: 'Oitavas de Final',
            rodada: 1,
          });
        }
        updateTournamentField('jogosEliminatoria', jogosOitavas);
        updateTournamentField('duplasBye', []);
        setFaseAtual('eliminatória');
      }
    }
    saveCurrentTournament();
  };

  const atualizarPlacarNaEliminatoria = (jogo, placar) => {
    console.log('Atualizando placar na eliminatória:', { jogo, placar });
    if (jogo.dupla1[0] === 'BYE' || jogo.dupla2[0] === 'BYE') {
      updateTournamentField('jogosEliminatoria', [
        ...currentTournament.jogosEliminatoria.map((j) =>
          j === jogo ? { ...j, placar: 'BYE', submetido: true } : j
        ),
      ]);
      const vencedora = jogo.dupla1[0] === 'BYE' ? jogo.dupla2 : jogo.dupla1;
      const chaveVencedora = vencedora.join('');
      updateTournamentField('historicoDuplas', (prev) => {
        const novoHistorico = { ...prev };
        novoHistorico[chaveVencedora] = {
          dupla: vencedora,
          jogos: (novoHistorico[chaveVencedora]?.jogos || 0) + 1,
          jogosVencidos: (novoHistorico[chaveVencedora]?.jogosVencidos || 0) + 1,
          pontos: (novoHistorico[chaveVencedora]?.pontos || 0) + 5,
          gamesVencidos: novoHistorico[chaveVencedora]?.gamesVencidos || 0,
          gamesPerdidos: novoHistorico[chaveVencedora]?.gamesPerdidos || 0,
        };
        console.log('Histórico após eliminatória (BYE):', novoHistorico);
        return novoHistorico;
      });
    } else {
      updateTournamentField('jogosEliminatoria', [
        ...currentTournament.jogosEliminatoria.map((j) =>
          j === jogo ? { ...j, placar, submetido: true } : j
        ),
      ]);
      updateTournamentField('historicoDuplas', (prev) => {
        const novoHistorico = { ...prev };
        const [g1, g2] = placar.split('-').map(Number);
        const chave1 = jogo.dupla1.join('');
        const chave2 = jogo.dupla2.join('');
        if (!novoHistorico[chave1])
          novoHistorico[chave1] = {
            dupla: jogo.dupla1,
            pontos: 0,
            jogos: 0,
            jogosVencidos: 0,
            gamesVencidos: 0,
            gamesPerdidos: 0,
          };
        if (!novoHistorico[chave2])
          novoHistorico[chave2] = {
            dupla: jogo.dupla2,
            pontos: 0,
            jogos: 0,
            jogosVencidos: 0,
            gamesVencidos: 0,
            gamesPerdidos: 0,
          };
        novoHistorico[chave1].jogos += 1;
        novoHistorico[chave2].jogos += 1;
        if (g1 > g2) {
          novoHistorico[chave1].pontos += 5;
          novoHistorico[chave1].jogosVencidos += 1;
          novoHistorico[chave1].gamesVencidos += g1;
          novoHistorico[chave1].gamesPerdidos += g2;
          novoHistorico[chave2].pontos += 2;
          novoHistorico[chave2].gamesVencidos += g2;
          novoHistorico[chave2].gamesPerdidos += g1;
        } else {
          novoHistorico[chave2].pontos += 5;
          novoHistorico[chave2].jogosVencidos += 1;
          novoHistorico[chave2].gamesVencidos += g2;
          novoHistorico[chave2].gamesPerdidos += g1;
          novoHistorico[chave1].pontos += 2;
          novoHistorico[chave1].gamesVencidos += g1;
          novoHistorico[chave1].gamesPerdidos += g2;
        }
        console.log('Histórico após eliminatória:', novoHistorico);
        return novoHistorico;
      });
    }
    saveCurrentTournament();
  };

  const iniciarFinal = (jogos) => {
    const semifinalGames = jogos.filter((jogo) => jogo.fase === 'Semifinal');
    if (semifinalGames.length !== 2) {
      console.error('Erro: Esperados 2 jogos de semifinal.');
      return;
    }
    const finalistas = semifinalGames.map((jogo) => {
      const [set1, set2] = jogo.placar.split('-').map(Number);
      return set1 > set2 ? jogo.dupla1 : jogo.dupla2;
    });
    const perdedores = semifinalGames.map((jogo) => {
      const [set1, set2] = jogo.placar.split('-').map(Number);
      return set1 > set2 ? jogo.dupla2 : jogo.dupla1;
    });
    updateTournamentField('jogosEliminatoria', [
      ...currentTournament.jogosEliminatoria,
      {
        dupla1: [...finalistas[0]],
        dupla2: [...finalistas[1]],
        placar: '',
        submetido: false,
        fase: 'Final',
        rodada: Math.max(...jogos.map((j) => j.rodada)) + 1,
      },
      {
        dupla1: [...perdedores[0]],
        dupla2: [...perdedores[1]],
        placar: '',
        submetido: false,
        fase: 'Disputa 3º Lugar',
        rodada: Math.max(...jogos.map((j) => j.rodada)) + 1,
      },
    ]);
    updateTournamentField('finalConfigurada', true);
    updateTournamentField('terceiroLugarConfigurado', true);
    setFaseAtual('final');
    saveCurrentTournament();
  };

  const atualizarPlacarNaFinal = (jogo, placar) => {
    console.log('Atualizando placar na final:', { jogo, placar });
    updateTournamentField('jogosEliminatoria', [
      ...currentTournament.jogosEliminatoria.map((j) =>
        j === jogo ? { ...j, placar, submetido: true } : j
      ),
    ]);
    updateTournamentField('historicoDuplas', (prev) => {
      const novoHistorico = { ...prev };
      const [g1, g2] = placar.split('-').map(Number);
      const chave1 = jogo.dupla1.join('');
      const chave2 = jogo.dupla2.join('');
      if (!novoHistorico[chave1])
        novoHistorico[chave1] = {
          dupla: jogo.dupla1,
          pontos: 0,
          jogos: 0,
          jogosVencidos: 0,
          gamesVencidos: 0,
          gamesPerdidos: 0,
        };
      if (!novoHistorico[chave2])
        novoHistorico[chave2] = {
          dupla: jogo.dupla2,
          pontos: 0,
          jogos: 0,
          jogosVencidos: 0,
          gamesVencidos: 0,
          gamesPerdidos: 0,
        };
      novoHistorico[chave1].jogos += 1;
      novoHistorico[chave2].jogos += 1;
      if (g1 > g2) {
        novoHistorico[chave1].pontos += 5;
        novoHistorico[chave1].jogosVencidos += 1;
        novoHistorico[chave1].gamesVencidos += g1;
        novoHistorico[chave1].gamesPerdidos += g2;
        novoHistorico[chave2].pontos += 2;
        novoHistorico[chave2].gamesVencidos += g2;
        novoHistorico[chave2].gamesPerdidos += g1;
      } else {
        novoHistorico[chave2].pontos += 5;
        novoHistorico[chave2].jogosVencidos += 1;
        novoHistorico[chave2].gamesVencidos += g2;
        novoHistorico[chave2].gamesPerdidos += g1;
        novoHistorico[chave1].pontos += 2;
        novoHistorico[chave1].gamesVencidos += g1;
        novoHistorico[chave1].gamesPerdidos += g2;
      }
      console.log('Histórico após final:', novoHistorico);
      return novoHistorico;
    });
    saveCurrentTournament();
  };

  const encerrarFaseEliminatoria = () => {
    const rodadaAtual = Math.max(
      ...currentTournament.jogosEliminatoria.map((j) => j.rodada)
    );
    const jogosRodadaAtual = currentTournament.jogosEliminatoria.filter(
      (j) => j.rodada === rodadaAtual
    );

    if (!jogosRodadaAtual.every((j) => j.submetido)) {
      alert('Todos os jogos da rodada atual devem ser submetidos antes de avançar.');
      return;
    }

    if (
      jogosRodadaAtual.some((j) => j.fase === 'Semifinal') &&
      !currentTournament.finalConfigurada
    ) {
      iniciarFinal(currentTournament.jogosEliminatoria);
    } else if (
      jogosRodadaAtual.some((j) => j.fase === 'Quartas de Final') &&
      currentTournament.duplas.length <= 11
    ) {
      const vencedoresQuartas = jogosRodadaAtual.map((jogo) => {
        const [set1, set2] = jogo.placar.split('-').map(Number);
        return set1 > set2 ? jogo.dupla1 : jogo.dupla2;
      });
      const semifinalMatches = [
        {
          dupla1: [...currentTournament.duplasBye[0]],
          dupla2: [...vencedoresQuartas[0]],
          placar: '',
          submetido: false,
          fase: 'Semifinal',
          rodada: rodadaAtual + 1,
        },
        {
          dupla1: [...currentTournament.duplasBye[1]],
          dupla2: [...vencedoresQuartas[1]],
          placar: '',
          submetido: false,
          fase: 'Semifinal',
          rodada: rodadaAtual + 1,
        },
      ];
      updateTournamentField('jogosEliminatoria', [
        ...currentTournament.jogosEliminatoria.filter((j) => j.rodada < rodadaAtual + 1),
        ...semifinalMatches,
      ]);
    } else {
      alert('Não há mais rodadas para avançar.');
    }
    saveCurrentTournament();
  };

  const finalizarTorneio = () => {
    const final = currentTournament.jogosEliminatoria.find(
      (jogo) => jogo.fase === 'Final'
    );
    const terceiroLugar = currentTournament.jogosEliminatoria.find(
      (jogo) => jogo.fase === 'Disputa 3º Lugar'
    );

    if (!final || !terceiroLugar || !final.placar || !terceiroLugar.placar) {
      alert('Erro: Final ou Disputa de 3º Lugar não estão completos.');
      return;
    }

    const [finalSet1, finalSet2] = final.placar.split('-').map(Number);
    const [vencedorFinal, perdedorFinal] =
      finalSet1 > finalSet2
        ? [final.dupla1, final.dupla2]
        : [final.dupla2, final.dupla1];

    const [terceiroSet1, terceiroSet2] = terceiroLugar.placar.split('-').map(Number);
    const [terceiro, quarto] =
      terceiroSet1 > terceiroSet2
        ? [terceiroLugar.dupla1, terceiroLugar.dupla2]
        : [terceiroLugar.dupla2, terceiroLugar.dupla1];

    updateTournamentField('ranking', [
      { lugar: 1, dupla: vencedorFinal },
      { lugar: 2, dupla: perdedorFinal },
      { lugar: 3, dupla: terceiro },
      { lugar: 4, dupla: quarto },
    ]);
    updateTournamentField('status', 'finalizado');
    setFaseAtual('finalizado');
    saveCurrentTournament();
  };

  const renderClassificacaoGrupo = (grupo) => {
    const ranking = classificarDuplasPorDesempate(grupo.duplas, grupo.jogos);
    const todosSubmetidos = grupo.jogos.every((jogo) => jogo.submetido);

    const formatarDataHora = (dataBase, incrementoMinutos) => {
      if (!dataBase) return 'Pendente';
      const data = new Date(dataBase);
      data.setMinutes(data.getMinutes() + incrementoMinutos);
      const diasSemana = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
      const meses = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
      const diaSemana = diasSemana[data.getDay()];
      const dia = String(data.getDate()).padStart(2, '0');
      const mes = meses[data.getMonth()];
      const hora = String(data.getHours()).padStart(2, '0');
      const minuto = String(data.getMinutes()).padStart(2, '0');
      return `${diaSemana}, ${dia}${mes} - ${hora}:${minuto}`;
    };

    return (
      <div key={`grupo-${grupo.id}`} className="grupo">
        <h3>Grupo {grupo.id + 1}</h3>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>JOGADORES</th>
              <th>JOGOS</th>
              <th>SETS</th>
              <th>GAMES</th>
              <th>CLASSIF.</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((dupla, index) => {
              const jogosDupla = grupo.jogos.filter(
                (j) =>
                  j.dupla1.join('') === dupla.join('') ||
                  j.dupla2.join('') === dupla.join('')
              );
              const jogosVencidos = jogosDupla.filter((j) => {
                if (!j.placar) return false;
                const [g1, g2] = j.placar.split('-').map(Number);
                return j.dupla1.join('') === dupla.join('') ? g1 > g2 : g2 > g1;
              }).length;
              const jogosPerdidos = jogosDupla.filter((j) => {
                if (!j.placar) return false;
                const [g1, g2] = j.placar.split('-').map(Number);
                return j.dupla1.join('') === dupla.join('') ? g1 < g2 : g2 < g1;
              }).length;
              const setsVencidos = jogosVencidos;
              const setsPerdidos = jogosPerdidos;
              const gamesVencidos = jogosDupla.reduce((acc, j) => {
                if (!j.placar) return acc;
                const [g1, g2] = j.placar.split('-').map(Number);
                return acc + (j.dupla1.join('') === dupla.join('') ? g1 : g2);
              }, 0);
              const gamesPerdidos = jogosDupla.reduce((acc, j) => {
                if (!j.placar) return acc;
                const [g1, g2] = j.placar.split('-').map(Number);
                return acc + (j.dupla1.join('') === dupla.join('') ? g2 : g1);
              }, 0);
              const classificado = todosSubmetidos && index < 2 ? '✓' : '';

              return (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{dupla.join(' & ')}</td>
                  <td>{jogosVencidos}/{jogosPerdidos}</td>
                  <td>{setsVencidos}/{setsPerdidos}</td>
                  <td>{gamesVencidos}/{gamesPerdidos}</td>
                  <td>{classificado}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <h4>Jogos</h4>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>DATA/HORA</th>
              <th>JOGADORES 01</th>
              <th>PLACAR</th>
              <th>JOGADORES 02</th>
              <th>VENCEDOR</th>
            </tr>
          </thead>
          <tbody>
            {grupo.jogos.map((jogo, idx) => {
              const [g1, g2] = jogo.placar ? jogo.placar.split('-').map(Number) : [0, 0];
              const vencedor = jogo.placar
                ? g1 > g2 ? jogo.dupla1.join(' & ') : g2 > g1 ? jogo.dupla2.join(' & ') : 'Empate'
                : 'A definir';
              const incrementoMinutos = idx * 30;
              const dataHora = formatarDataHora(currentTournament.dataTorneio, incrementoMinutos);
              return (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td>{dataHora}</td>
                  <td>{jogo.dupla1.join(' & ')}</td>
                  <td>{jogo.placar || 'Pendente'}</td>
                  <td>{jogo.dupla2.join(' & ')}</td>
                  <td>{vencedor}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderizarFaseEliminatoria = (jogos) => {
    const rodadas = [...new Set(jogos.map((j) => j.rodada))].sort((a, b) => a - b);
    return rodadas.map((rodada) => {
      const jogosDaRodada = jogos.filter((j) => j.rodada === rodada);
      const fase = jogosDaRodada[0]?.fase || '';
      return (
        <div key={rodada} className="rodada">
          <h3>{fase} - Rodada {rodada}</h3>
          <table>
            <thead>
              <tr>
                <th>JOGADORES 01</th>
                <th>PLACAR</th>
                <th>JOGADORES 02</th>
                <th>VENCEDOR</th>
              </tr>
            </thead>
            <tbody>
              {jogosDaRodada.map((jogo, index) => {
                const vencedor =
                  jogo.placar && jogo.submetido
                    ? parseInt(jogo.placar.split('-')[0]) > parseInt(jogo.placar.split('-')[1])
                      ? jogo.dupla1.join(' & ')
                      : jogo.dupla2.join(' & ')
                    : 'A definir';
                return (
                  <tr key={index}>
                    <td>{jogo.dupla1.join(' & ')}</td>
                    <td>{jogo.placar || 'Pendente'}</td>
                    <td>{jogo.dupla2.join(' & ')}</td>
                    <td>{vencedor}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    });
  };

  const gerarRelatorioEstatisticas = () => {
    const todosOsJogos = [
      ...currentTournament.grupos.flatMap((grupo) => grupo.jogos),
      ...currentTournament.jogosEliminatoria.filter((jogo) => jogo.placar !== 'BYE'),
    ].filter((jogo) => jogo.submetido);

    console.log('Todos os jogos para relatório:', todosOsJogos);
    const totalPartidas = todosOsJogos.length;
    const totalGames = todosOsJogos.reduce((acc, jogo) => {
      const [g1, g2] = jogo.placar.split('-').map(Number);
      return acc + (isNaN(g1) || isNaN(g2) ? 0 : g1 + g2);
    }, 0);

    let historicoDuplas = currentTournament.historicoDuplas || {};
    if (Object.keys(historicoDuplas).length === 0) {
      console.warn('historicoDuplas está vazio ou undefined, reconstruindo a partir dos jogos.');
      historicoDuplas = currentTournament.duplas.reduce((acc, dupla) => {
        acc[dupla.join('')] = { dupla, pontos: 0, jogos: 0, jogosVencidos: 0, gamesVencidos: 0, gamesPerdidos: 0 };
        return acc;
      }, {});

      todosOsJogos.forEach((jogo) => {
        const [g1, g2] = jogo.placar.split('-').map(Number);
        if (isNaN(g1) || isNaN(g2)) return;
        const chave1 = jogo.dupla1.join('');
        const chave2 = jogo.dupla2.join('');
        historicoDuplas[chave1].jogos += 1;
        historicoDuplas[chave2].jogos += 1;
        if (g1 > g2) {
          historicoDuplas[chave1].pontos += 5;
          historicoDuplas[chave1].jogosVencidos += 1;
          historicoDuplas[chave1].gamesVencidos += g1;
          historicoDuplas[chave1].gamesPerdidos += g2;
          historicoDuplas[chave2].pontos += 2;
          historicoDuplas[chave2].gamesVencidos += g2;
          historicoDuplas[chave2].gamesPerdidos += g1;
        } else {
          historicoDuplas[chave2].pontos += 5;
          historicoDuplas[chave2].jogosVencidos += 1;
          historicoDuplas[chave2].gamesVencidos += g2;
          historicoDuplas[chave2].gamesPerdidos += g1;
          historicoDuplas[chave1].pontos += 2;
          historicoDuplas[chave1].gamesVencidos += g1;
          historicoDuplas[chave1].gamesPerdidos += g2;
        }
      });
      updateTournamentField('historicoDuplas', historicoDuplas);
    }

    const estatisticasDuplas = Object.values(historicoDuplas).map((dados) => {
      const derrotas = dados.jogos - dados.jogosVencidos;
      const saldoGames = dados.gamesVencidos - dados.gamesPerdidos;
      const posicaoRanking =
        currentTournament.ranking.find((r) => r.dupla.join('') === dados.dupla.join(''))?.lugar || '-';
      return {
        dupla: dados.dupla.join(' & '),
        jogos: dados.jogos,
        vitorias: dados.jogosVencidos,
        derrotas,
        gamesVencidos: dados.gamesVencidos,
        gamesPerdidos: dados.gamesPerdidos,
        saldoGames,
        posicaoRanking,
      };
    }).sort((a, b) => {
      if (a.posicaoRanking === '-' && b.posicaoRanking !== '-') return 1;
      if (b.posicaoRanking === '-' && a.posicaoRanking !== '-') return -1;
      if (a.posicaoRanking !== '-' && b.posicaoRanking !== '-') return a.posicaoRanking - b.posicaoRanking;
      return b.saldoGames - a.saldoGames;
    });

    const melhorCampanha = estatisticasDuplas.reduce(
      (melhor, atual) => (atual.saldoGames > melhor.saldoGames ? atual : melhor),
      estatisticasDuplas[0] || { dupla: 'Nenhuma', vitorias: 0, jogos: 0, saldoGames: 0 }
    );

    console.log('Estatísticas finais:', estatisticasDuplas);
    return {
      totalPartidas,
      totalGames,
      estatisticasDuplas,
      melhorCampanha,
    };
  };

  const resetTournament = () => {
    setCurrentTournament(null);
    setFaseAtual('menu');
  };

  const add8Duplas = () => {
    const newDuplas = [];
    for (let i = 1; i <= 8; i++) {
      newDuplas.push([`JOGADOR${i * 2 - 1}`, `JOGADOR${i * 2}`]);
    }
    updateTournamentField('duplas', [...currentTournament.duplas, ...newDuplas]);
  };

  return (
    <div className="App">
      <header>
        <img src={btConnectLogo} alt="btConnect Logo" className="header-logo" />
      </header>
      <main>
        {faseAtual === 'menu' && (
          <MeusTorneios
            tournaments={tournaments}
            onSelectTournament={loadTournament}
            onCreateNew={createNewTournament}
            onDeleteTournament={handleDeleteTournament}
            onImportTournaments={handleImportTournaments} // Passa a função para importar
          />
        )}
        {faseAtual === 'duplas' && (
          <div className="tournament-setup">
            <div className="input-section">
              <div className="input-container">
                <label>Nome do Torneio:</label>
                <input
                  type="text"
                  value={currentTournament?.nome || ''}
                  onChange={(e) =>
                    updateTournamentField('nome', e.target.value.toUpperCase())
                  }
                  placeholder="Nome do torneio"
                />
              </div>
              <div className="input-container">
                <label>Data de Início:</label>
                <input
                  type="date"
                  value={currentTournament?.dataInicio || ''}
                  onChange={(e) =>
                    updateTournamentField('dataInicio', e.target.value)
                  }
                />
              </div>
              <div className="input-container">
                <label>Hora de Início:</label>
                <input
                  type="time"
                  value={currentTournament?.horaInicio || ''}
                  onChange={(e) =>
                    updateTournamentField('horaInicio', e.target.value)
                  }
                />
              </div>
            </div>
            <div className="image-section">
              <img src={gameDay} alt="Game Day" className="tournament-image" />
            </div>
            <div className="duplas-section">
              <div className="button-container">
                <button
                  className="GerarChaves"
                  onClick={() => {
                    try {
                      const tournament = generateTournament(
                        currentTournament.nome,
                        currentTournament.duplas,
                        currentTournament.dataInicio,
                        currentTournament.horaInicio
                      );
                      setCurrentTournament(tournament);
                      setTournaments(loadTournaments());
                      setFaseAtual('grupos');
                    } catch (error) {
                      alert(error.message);
                    }
                  }}
                >
                  <img
                    src={shuffleIcon}
                    alt="Shuffle Icon"
                    className="shuffle-icon"
                  />
                  Gerar Chaveamento
                </button>
                {currentTournament?.status === 'rascunho' && (
                  <button className="iniciar-torneio" onClick={startTournament}>
                    <img
                      src={tournamentsIcon}
                      alt="Tournament Icon"
                      className="button-icon"
                    />
                    Iniciar Torneio
                  </button>
                )}
                <button className="homePage" onClick={() => setFaseAtual('menu')}>
                  <img
                    src={folderIcon}
                    alt="Folder Icon"
                    className="folder-icon"
                  />
                  Meus Torneios
                </button>
                <button onClick={add8Duplas}>Adicionar 8 Duplas</button>
              </div>
              <DuplasList
                duplas={currentTournament?.duplas || []}
                onAddDupla={addDupla}
                onRemoveDupla={removeDupla}
              />
            </div>
          </div>
        )}
        {faseAtual === 'grupos' && (
          <>
            <FaseDeGrupos
              grupos={currentTournament.grupos}
              onUpdateGroups={(newGrupos) =>
                updateTournamentField('grupos', newGrupos)
              }
            />
            <button onClick={encerrarFaseGrupos}>Encerrar Fase de Grupos</button>
            <div className="acompanhamento">
              <h2>Acompanhamento - Fase de Grupos</h2>
              {currentTournament.grupos.map((grupo) => renderClassificacaoGrupo(grupo))}
            </div>
          </>
        )}
        {faseAtual === 'eliminatória' && (
          <>
            <h2>Fase Eliminatória</h2>
            <FaseEliminatoria
              jogos={currentTournament.jogosEliminatoria.filter(
                (jogo) =>
                  !jogo.submetido ||
                  jogo.rodada === Math.max(...currentTournament.jogosEliminatoria.map((j) => j.rodada))
              )}
              onAtualizarPlacar={atualizarPlacarNaEliminatoria}
            />
            <button onClick={encerrarFaseEliminatoria}>Encerrar Etapa</button>
            <div className="acompanhamento">
              <h2>Acompanhamento - Fase Eliminatória</h2>
              {renderizarFaseEliminatoria(currentTournament.jogosEliminatoria)}
            </div>
          </>
        )}
        {faseAtual === 'final' && (
          <>
            <h2>Final do Torneio</h2>
            <FaseFinal
              jogos={currentTournament.jogosEliminatoria.filter(
                (jogo) => jogo.fase === 'Final' || jogo.fase === 'Disputa 3º Lugar'
              )}
              onAtualizarPlacar={atualizarPlacarNaFinal}
              onFinalizarTorneio={finalizarTorneio}
            />
            {currentTournament.jogosEliminatoria
              .filter((jogo) => jogo.fase === 'Final' || jogo.fase === 'Disputa 3º Lugar')
              .every((jogo) => jogo.submetido) && (
              <button onClick={finalizarTorneio}>Encerrar Campeonato</button>
            )}
            <div className="acompanhamento">
              <h2>Acompanhamento - Fase Final</h2>
              {renderizarFaseEliminatoria(
                currentTournament.jogosEliminatoria.filter(
                  (jogo) => jogo.fase === 'Final' || jogo.fase === 'Disputa 3º Lugar'
                )
              )}
            </div>
          </>
        )}
        {faseAtual === 'finalizado' && (
          <>
            <h3>Ranking Final:</h3>
            <table>
              <thead>
                <tr>
                  <th>POSIÇÃO</th>
                  <th>DUPLAS</th>
                </tr>
              </thead>
              <tbody>
                {currentTournament.ranking.map((posição, index) => {
                  let medalha = '';
                  let color = '#000';
                  if (posição.lugar === 1) {
                    medalha = '🥇';
                    color = 'gold';
                  } else if (posição.lugar === 2) {
                    medalha = '🥈';
                    color = 'silver';
                  } else if (posição.lugar === 3) {
                    medalha = '🥉';
                    color = 'brown';
                  }
                  return (
                    <tr key={index}>
                      <td style={{ color }}>{medalha} {posição.lugar}º Colocado</td>
                      <td>{posição.dupla.join(' & ')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="relatorio-estatisticas">
              <h3>Estatísticas Gerais do Torneio</h3>
              {(() => {
                const { totalPartidas, totalGames, estatisticasDuplas, melhorCampanha } =
                  gerarRelatorioEstatisticas();
                return (
                  <>
                    <p><strong>Total de Partidas Disputadas:</strong> {totalPartidas}</p>
                    <p><strong>Total de Games Disputados:</strong> {totalGames}</p>
                    <p>
                      <strong>Melhor Campanha:</strong> {melhorCampanha.dupla} (
                      Saldo de Games: {melhorCampanha.saldoGames}, {melhorCampanha.vitorias} vitórias em{' '}
                      {melhorCampanha.jogos} jogos)
                    </p>
                    <h4>Estatísticas por Dupla</h4>
                    {estatisticasDuplas.length > 0 ? (
                      <table>
                        <thead>
                          <tr>
                            <th>POSIÇÃO</th>
                            <th>DUPLA</th>
                            <th>PARTIDAS</th>
                            <th>VITÓRIAS</th>
                            <th>DERROTAS</th>
                            <th>GAMES (V/P)</th>
                            <th>SALDO GAMES</th>
                          </tr>
                        </thead>
                        <tbody>
                          {estatisticasDuplas.map((dupla, index) => (
                            <tr key={index}>
                              <td>{dupla.posicaoRanking !== '-' ? `${dupla.posicaoRanking}º` : '-'}</td>
                              <td>{dupla.dupla}</td>
                              <td>{dupla.jogos}</td>
                              <td>{dupla.vitorias}</td>
                              <td>{dupla.derrotas}</td>
                              <td>{dupla.gamesVencidos}/{dupla.gamesPerdidos}</td>
                              <td>{dupla.saldoGames}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p>Nenhuma estatística disponível para as duplas.</p>
                    )}

                    <div className="historico-jogos">
                      <h4>Histórico de Jogos</h4>
                      <h5>Fase de Grupos</h5>
                      {currentTournament.grupos.map((grupo) => (
                        <div key={`grupo-${grupo.id}`}>
                          <h6>Grupo {grupo.id + 1}</h6>
                          <table>
                            <thead>
                              <tr>
                                <th>Jogo</th>
                                <th>Dupla 1</th>
                                <th>Placar</th>
                                <th>Dupla 2</th>
                              </tr>
                            </thead>
                            <tbody>
                              {grupo.jogos
                                .filter((jogo) => jogo.submetido)
                                .map((jogo, index) => (
                                  <tr key={index}>
                                    <td>{index + 1}</td>
                                    <td>{jogo.dupla1.join(' & ')}</td>
                                    <td>{jogo.placar}</td>
                                    <td>{jogo.dupla2.join(' & ')}</td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      ))}

                      <h5>Fase Eliminatória</h5>
                      <table>
                        <thead>
                          <tr>
                            <th>Jogo</th>
                            <th>Dupla 1</th>
                            <th>Placar</th>
                            <th>Dupla 2</th>
                            <th>Fase</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentTournament.jogosEliminatoria
                            .filter((jogo) => jogo.submetido && jogo.fase !== 'Final' && jogo.fase !== 'Disputa 3º Lugar')
                            .map((jogo, index) => (
                              <tr key={index}>
                                <td>{index + 1}</td>
                                <td>{jogo.dupla1.join(' & ')}</td>
                                <td>{jogo.placar}</td>
                                <td>{jogo.dupla2.join(' & ')}</td>
                                <td>{jogo.fase}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>

                      <h5>Fase Final</h5>
                      <table>
                        <thead>
                          <tr>
                            <th>Jogo</th>
                            <th>Dupla 1</th>
                            <th>Placar</th>
                            <th>Dupla 2</th>
                            <th>Fase</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentTournament.jogosEliminatoria
                            .filter((jogo) => jogo.submetido && (jogo.fase === 'Final' || jogo.fase === 'Disputa 3º Lugar'))
                            .map((jogo, index) => (
                              <tr key={index}>
                                <td>{index + 1}</td>
                                <td>{jogo.dupla1.join(' & ')}</td>
                                <td>{jogo.placar}</td>
                                <td>{jogo.dupla2.join(' & ')}</td>
                                <td>{jogo.fase}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>

                    <p>Torneio Finalizado em {new Date().toLocaleString('pt-BR')}!</p>
                    <button onClick={resetTournament} className="novo-torneio-btn">
                      Início
                    </button>
                  </>
                );
              })()}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;