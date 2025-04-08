import React, { useState, useEffect, useCallback } from 'react';
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
  classificarDuplas,
  iniciarFaseEliminatoria,
  avancarRodadaEliminatoria,
  criarJogosParaGrupo,
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
  const [manualGroups, setManualGroups] = useState(null);
  const [mostrarTodasDuplas, setMostrarTodasDuplas] = useState(false); // Novo estado

  useEffect(() => {
    const updatedTournaments = loadTournaments();
    setTournaments(updatedTournaments);
  }, []);

  const saveCurrentTournament = useCallback(() => {
    if (currentTournament && currentTournament.nome && currentTournament.dataInicio && currentTournament.horaInicio) {
      const tournamentToSave = {
        ...currentTournament,
        faseAtual,
        status: currentTournament.status
      };
      console.log('Salvando torneio no localStorage com status:', tournamentToSave.status);
      saveTournament(tournamentToSave);
      setTournaments(loadTournaments());
    }
  }, [currentTournament, faseAtual]);

  const updateTournamentField = useCallback((field, value) => {
    setCurrentTournament((prev) => {
      const updated = { ...prev, [field]: value };
      console.log(`Atualizando ${field}:`, value);
      if (updated.nome && updated.dataInicio && updated.horaInicio) {
        saveCurrentTournament();
      }
      return updated;
    });
  }, [saveCurrentTournament]);

  const createNewTournament = useCallback(() => {
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
  }, []);

  const loadTournament = useCallback((nome) => {
    const tournament = tournaments[nome];
    if (tournament) {
      console.log('Carregando torneio do localStorage:', tournament);
      setCurrentTournament(tournament);
      setFaseAtual(tournament.status === 'finalizado' ? 'finalizado' : tournament.faseAtual || 'duplas');
    } else {
      createNewTournament();
    }
  }, [tournaments, createNewTournament]);

  const handleDeleteTournament = useCallback((nome) => {
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
  }, [currentTournament]);

  const handleImportTournaments = useCallback((importedTournaments) => {
    setTournaments((prev) => {
      const updatedTournaments = { ...prev, ...importedTournaments };
      Object.entries(updatedTournaments).forEach(([nome, tournament]) => {
        saveTournament(tournament);
      });
      return updatedTournaments;
    });
  }, []);

  const addDupla = useCallback((dupla) => {
    if (
      !currentTournament?.duplas.some(
        (d) => d.includes(dupla[0]) || d.includes(dupla[1])
      )
    ) {
      updateTournamentField('duplas', [...currentTournament.duplas, dupla]);
    } else {
      alert('Os nomes dos jogadores devem ser únicos.');
    }
  }, [currentTournament, updateTournamentField]);

  const removeDupla = useCallback((index) => {
    updateTournamentField(
      'duplas',
      currentTournament.duplas.filter((_, i) => i !== index)
    );
  }, [currentTournament, updateTournamentField]);

  const startTournament = useCallback(() => {
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
  }, [currentTournament, saveCurrentTournament]);

  const iniciarChavesManuais = useCallback(() => {
    const numDuplas = currentTournament.duplas.length;
    if (numDuplas < 3) {
      alert('É necessário pelo menos 3 duplas para criar um torneio.');
      return;
    }
    if (!currentTournament.nome || !currentTournament.dataInicio || !currentTournament.horaInicio) {
      alert('Preencha o nome, data e hora de início do torneio.');
      return;
    }

    let numGrupos;
    if (numDuplas === 6) numGrupos = 2;
    else if (numDuplas === 14) numGrupos = 4;
    else if (numDuplas <= 5) numGrupos = 1;
    else if (numDuplas <= 8) numGrupos = 2;
    else if (numDuplas <= 11) numGrupos = 3;
    else if (numDuplas <= 17) numGrupos = 5;
    else if (numDuplas <= 20) numGrupos = 6;
    else numGrupos = Math.ceil(numDuplas / 3);

    const gruposIniciais = Array(numGrupos).fill().map((_, i) => ({
      id: i,
      duplas: [],
    }));

    if (numDuplas === 6) {
      gruposIniciais[0].maxDuplas = 3;
      gruposIniciais[1].maxDuplas = 3;
    } else if (numDuplas === 14) {
      gruposIniciais[0].maxDuplas = 4;
      gruposIniciais[1].maxDuplas = 4;
      gruposIniciais[2].maxDuplas = 3;
      gruposIniciais[3].maxDuplas = 3;
    } else {
      const baseSize = Math.floor(numDuplas / numGrupos);
      const extras = numDuplas % numGrupos;
      gruposIniciais.forEach((grupo, i) => {
        grupo.maxDuplas = baseSize + (i < extras ? 1 : 0);
      });
    }

    setManualGroups(gruposIniciais);
  }, [currentTournament]);

  const confirmarChavesManuais = useCallback(() => {
    const totalDuplasAtribuidas = manualGroups.reduce((acc, grupo) => acc + grupo.duplas.length, 0);
    if (totalDuplasAtribuidas !== currentTournament.duplas.length) {
      alert('Todas as duplas devem ser atribuídas aos grupos.');
      return;
    }

    const gruposComJogos = manualGroups.map((grupo) => ({
      ...grupo,
      jogos: criarJogosParaGrupo(grupo.duplas, grupo.id),
    }));

    const historicoInicial = currentTournament.duplas.reduce((acc, dupla) => {
      acc[dupla.join('')] = { dupla, pontos: 0, jogos: 0, jogosVencidos: 0, gamesVencidos: 0, gamesPerdidos: 0 };
      return acc;
    }, {});

    setCurrentTournament((prev) => ({
      ...prev,
      grupos: gruposComJogos,
      historicoDuplas: historicoInicial,
      status: 'em andamento',
      dataCriacao: new Date().toISOString(),
    }));
    setFaseAtual('grupos');
    setManualGroups(null);
    saveCurrentTournament();
  }, [manualGroups, currentTournament, saveCurrentTournament]);

  const gerarSumulas = useCallback((fase, jogos) => {
    const dataTorneio = currentTournament.dataInicio;
    const horaInicio = currentTournament.horaInicio;
    const categoria = currentTournament.duplas.length === 6 ? 'D' : 'B/C';

    const sumulasHtml = [];
    for (let i = 0; i < jogos.length; i += 2) {
      const jogo1 = jogos[i];
      const jogo2 = jogos[i + 1] || null;

      const getSumulaHtml = (jogo, index) => {
        if (!jogo) return '';
        const grupoId = fase === 'grupos' ? jogo.grupoId + 1 : '';
        const faseNome = fase === 'grupos' ? `Grupo ${grupoId}` : jogo.fase;
        const horarioEstimado = new Date(`${dataTorneio}T${horaInicio}`);
        horarioEstimado.setMinutes(horarioEstimado.getMinutes() + index * 30);
        const horarioFormatado = horarioEstimado.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        return `
          <div class="sumula" style="font-family: Arial, sans-serif; font-size: 9pt; width: 190mm; height: 135mm; margin: 5mm auto; padding: 0; border: 1px solid #000;">
            <h2 style="text-align: center; font-size: 11pt; margin: 3px 0;">SÚMULA DE JOGO</h2>
            <h3 style="text-align: center; font-size: 9pt; margin: 2px 0;">Arena Beach Tennis - Monte Santo de Minas/MG</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 8pt;">
              <tr>
                <td><strong>Cat.:</strong> ${categoria}</td>
                <td><strong>Data:</strong> ${new Date(dataTorneio).toLocaleDateString('pt-BR')}</td>
                <td><strong>Horário:</strong> ${horarioFormatado}</td>
              </tr>
              <tr>
                <td colspan="3"><strong>Fase:</strong> ${faseNome}</td>
              </tr>
            </table>
            <hr style="margin: 3px 0;">
            <table style="width: 100%; border-collapse: collapse; font-size: 8pt;">
              <tr>
                <td style="width: 50%;"><strong>Dupla 1:</strong> ${jogo.dupla1[0]} & ${jogo.dupla1[1]}</td>
                <td style="width: 50%;"><strong>Dupla 2:</strong> ${jogo.dupla2[0]} & ${jogo.dupla2[1]}</td>
              </tr>
            </table>
            <table style="width: 40%; margin: 3px auto; text-align: center; border-collapse: collapse; font-size: 8pt;">
              <tr>
                <th>D1</th>
                <th>X</th>
                <th>D2</th>
              </tr>
              <tr>
                <td style="border: 1px solid #000; height: 15px; width: 30px;">___</td>
                <td>-</td>
                <td style="border: 1px solid #000; height: 15px; width: 30px;">___</td>
              </tr>
            </table>
            <p style="font-size: 7pt; text-align: center; margin: 2px 0;">Set até 6 (W.O.: 6x0)</p>
            <hr style="margin: 3px 0;">
            <p style="font-size: 8pt; margin: 2px 0;">
              <strong>Vencedor:</strong> [ ] D1 [ ] D2 [ ] W.O.  
              <strong>Placar:</strong> ___ x ___
            </p>
            <p style="font-size: 8pt; margin: 2px 0;">
              <strong>Resp.:</strong> _____________________<br>
              <strong>Org.:</strong> _____________________<br>
              <strong>Entrega:</strong> ___/___ às ___:___
            </p>
            <p style="font-size: 7pt; margin: 2px 0;">Obs.: _____________________</p>
          </div>
        `;
      };

      sumulasHtml.push(`
        <div class="page" style="width: 210mm; height: 297mm; margin: 0 auto; padding: 0;">
          ${getSumulaHtml(jogo1, i)}
          ${jogo2 ? '<hr style="border: 1px dashed #000; margin: 5mm 0;">' : ''}
          ${jogo2 ? getSumulaHtml(jogo2, i + 1) : ''}
        </div>
      `);
    }

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Súmulas - Torneio de Beach Tennis</title>
          <style>
            @media print {
              .page { page-break-after: always; }
              body { margin: 0; padding: 0; }
              .sumula { box-sizing: border-box; }
            }
          </style>
        </head>
        <body>${sumulasHtml.join('')}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }, [currentTournament]);

  const imprimirSumulasGrupos = useCallback(() => {
    const jogosGrupos = currentTournament.grupos.flatMap((grupo) => grupo.jogos);
    gerarSumulas('grupos', jogosGrupos);
  }, [currentTournament, gerarSumulas]);

  const imprimirSumulasEliminatorias = useCallback((rodada) => {
    const jogosRodada = currentTournament.jogosEliminatoria.filter((j) => j.rodada === rodada);
    gerarSumulas('eliminatória', jogosRodada);
  }, [currentTournament, gerarSumulas]);

  const encerrarFaseGrupos = useCallback(() => {
    if (
      currentTournament.grupos.some((grupo) =>
        grupo.jogos.some((jogo) => !jogo.submetido || !jogo.placar)
      )
    ) {
      alert('Todos os jogos da fase de grupos devem ter placares submetidos antes de encerrar.');
      return;
    }

    const todosOsJogos = currentTournament.grupos.flatMap((grupo) => grupo.jogos);

    updateTournamentField('historicoDuplas', (prev) => {
      const novoHistorico = { ...prev };
      todosOsJogos.forEach((jogo) => {
        if (!jogo.placar || !jogo.placar.includes('-') || !jogo.submetido) return;
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
      return novoHistorico;
    });

    const numDuplas = currentTournament.duplas.length;
    const classificados = classificarDuplas(currentTournament.grupos);

    if (numDuplas <= 4) {
      const ranking = classificarDuplasPorDesempate(classificados.map(c => c.dupla), todosOsJogos);
      const updatedTournament = {
        ...currentTournament,
        ranking: ranking.map((dupla, index) => ({
          lugar: index + 1,
          dupla: dupla,
        })),
        status: 'finalizado',
        faseAtual: 'finalizado'
      };
      setCurrentTournament(updatedTournament);
      setFaseAtual('finalizado');
      saveTournament(updatedTournament);
    } else {
      const jogosEliminatoria = iniciarFaseEliminatoria(classificados);
      updateTournamentField('jogosEliminatoria', jogosEliminatoria);
      updateTournamentField('duplasBye', []);
      setFaseAtual('eliminatória');
      saveCurrentTournament();
    }
  }, [currentTournament, updateTournamentField, saveCurrentTournament]);

  const atualizarPlacarNaEliminatoria = useCallback((jogo, placar) => {
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
  }, [currentTournament, updateTournamentField, saveCurrentTournament]);

  const iniciarFinal = useCallback((jogos) => {
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
  }, [currentTournament, updateTournamentField, saveCurrentTournament]);

  const atualizarPlacarNaFinal = useCallback((jogo, placar) => {
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
  }, [currentTournament, updateTournamentField, saveCurrentTournament]);

  const encerrarFaseEliminatoria = useCallback((jogos) => {
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

    const vencedores = jogosRodadaAtual.map((jogo) => {
      if (jogo.dupla2[0] === 'BYE') return jogo.dupla1;
      const [set1, set2] = jogo.placar.split('-').map(Number);
      return set1 > set2 ? jogo.dupla1 : jogo.dupla2;
    });

    if (vencedores.length === 2 && !currentTournament.finalConfigurada) {
      iniciarFinal(jogosRodadaAtual);
    } else if (vencedores.length > 2) {
      const novaRodada = avancarRodadaEliminatoria(jogosRodadaAtual);
      updateTournamentField('jogosEliminatoria', [
        ...currentTournament.jogosEliminatoria,
        ...novaRodada,
      ]);
      saveCurrentTournament();
    } else {
      alert('Não há mais rodadas para avançar.');
    }
  }, [currentTournament, updateTournamentField, saveCurrentTournament, iniciarFinal]);

  const finalizarTorneio = useCallback(() => {
    const final = currentTournament.jogosEliminatoria.find(
      (jogo) => jogo.fase === 'Final'
    );
    const terceiroLugar = currentTournament.jogosEliminatoria.find(
      (jogo) => jogo.fase === 'Disputa 3º Lugar'
    );

    if (!final || !terceiroLugar || !final.submetido || !terceiroLugar.submetido) {
      alert('Erro: Final ou Disputa de 3º Lugar não estão completos. Certifique-se de que todos os placares foram submetidos.');
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

    const updatedTournament = {
      ...currentTournament,
      ranking: [
        { lugar: 1, dupla: vencedorFinal },
        { lugar: 2, dupla: perdedorFinal },
        { lugar: 3, dupla: terceiro },
        { lugar: 4, dupla: quarto },
      ],
      status: 'finalizado',
      faseAtual: 'finalizado'
    };

    setCurrentTournament(updatedTournament);
    setFaseAtual('finalizado');

    console.log('Finalizando torneio. Novo status:', updatedTournament.status);
    saveTournament(updatedTournament);

    setTournaments((prev) => ({
      ...prev,
      [updatedTournament.nome]: updatedTournament
    }));
  }, [currentTournament]);

  const renderClassificacaoGrupo = useCallback((grupo) => {
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
  }, [currentTournament]);

  const renderizarFaseEliminatoria = useCallback((jogos) => {
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
          <button onClick={() => imprimirSumulasEliminatorias(rodada)}>
            Imprimir Súmulas da Rodada {rodada}
          </button>
        </div>
      );
    });
  }, [imprimirSumulasEliminatorias]);

  const gerarRelatorioEstatisticas = useCallback(() => {
    const todosOsJogos = [
      ...currentTournament.grupos.flatMap((grupo) => grupo.jogos),
      ...currentTournament.jogosEliminatoria.filter((jogo) => jogo.placar !== 'BYE'),
    ].filter((jogo) => jogo.submetido);

    const totalPartidas = todosOsJogos.length;
    const totalGames = todosOsJogos.reduce((acc, jogo) => {
      const [g1, g2] = jogo.placar.split('-').map(Number);
      return acc + (isNaN(g1) || isNaN(g2) ? 0 : g1 + g2);
    }, 0);

    const historicoDuplasCalculado = {};
    todosOsJogos.forEach((jogo) => {
      const [g1, g2] = jogo.placar.split('-').map(Number);
      if (isNaN(g1) || isNaN(g2)) return;
      const chave1 = jogo.dupla1.join('');
      const chave2 = jogo.dupla2.join('');

      if (!historicoDuplasCalculado[chave1]) {
        historicoDuplasCalculado[chave1] = {
          dupla: jogo.dupla1,
          pontos: 0,
          jogos: 0,
          jogosVencidos: 0,
          gamesVencidos: 0,
          gamesPerdidos: 0,
        };
      }
      if (!historicoDuplasCalculado[chave2]) {
        historicoDuplasCalculado[chave2] = {
          dupla: jogo.dupla2,
          pontos: 0,
          jogos: 0,
          jogosVencidos: 0,
          gamesVencidos: 0,
          gamesPerdidos: 0,
        };
      }

      historicoDuplasCalculado[chave1].jogos += 1;
      historicoDuplasCalculado[chave2].jogos += 1;
      if (g1 > g2) {
        historicoDuplasCalculado[chave1].pontos += 5;
        historicoDuplasCalculado[chave1].jogosVencidos += 1;
        historicoDuplasCalculado[chave1].gamesVencidos += g1;
        historicoDuplasCalculado[chave1].gamesPerdidos += g2;
        historicoDuplasCalculado[chave2].pontos += 2;
        historicoDuplasCalculado[chave2].gamesVencidos += g2;
        historicoDuplasCalculado[chave2].gamesPerdidos += g1;
      } else {
        historicoDuplasCalculado[chave2].pontos += 5;
        historicoDuplasCalculado[chave2].jogosVencidos += 1;
        historicoDuplasCalculado[chave2].gamesVencidos += g2;
        historicoDuplasCalculado[chave2].gamesPerdidos += g1;
        historicoDuplasCalculado[chave1].pontos += 2;
        historicoDuplasCalculado[chave1].gamesVencidos += g1;
        historicoDuplasCalculado[chave1].gamesPerdidos += g2;
      }
    });

    const historicoDuplas = currentTournament.historicoDuplas && Object.keys(currentTournament.historicoDuplas).length > 0
      ? currentTournament.historicoDuplas
      : historicoDuplasCalculado;

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

    const melhorCampanha = estatisticasDuplas.length > 0
      ? estatisticasDuplas.reduce(
        (melhor, atual) => (atual.saldoGames > melhor.saldoGames ? atual : melhor),
        estatisticasDuplas[0]
      )
      : { dupla: 'Nenhuma', vitorias: 0, jogos: 0, saldoGames: 0 };

    return {
      totalPartidas,
      totalGames,
      estatisticasDuplas,
      melhorCampanha,
    };
  }, [currentTournament]);

  const resetTournament = useCallback(() => {
    setCurrentTournament(null);
    setFaseAtual('menu');
  }, []);

  const add8Duplas = useCallback(() => {
    const newDuplas = [];
    for (let i = 1; i <= 8; i++) {
      newDuplas.push([`JOGADOR${i * 2 - 1}`, `JOGADOR${i * 2}`]);
    }
    updateTournamentField('duplas', [...currentTournament.duplas, ...newDuplas]);
  }, [currentTournament, updateTournamentField]);

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
            onImportTournaments={handleImportTournaments}
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
                  onChange={(e) => updateTournamentField('nome', e.target.value.toUpperCase())}
                  placeholder="Nome do torneio"
                />
              </div>
              <div className="input-container">
                <label>Data de Início:</label>
                <input
                  type="date"
                  value={currentTournament?.dataInicio || ''}
                  onChange={(e) => updateTournamentField('dataInicio', e.target.value)}
                />
              </div>
              <div className="input-container">
                <label>Hora de Início:</label>
                <input
                  type="time"
                  value={currentTournament?.horaInicio || ''}
                  onChange={(e) => updateTournamentField('horaInicio', e.target.value)}
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
                  <img src={shuffleIcon} alt="Shuffle Icon" className="shuffle-icon" />
                  Gerar Chaveamento
                </button>
                <button className="GerarChavesManuais" onClick={iniciarChavesManuais}>
                  Gerar Chaves Manuais
                </button>
                {currentTournament?.status === 'rascunho' && (
                  <button className="iniciar-torneio" onClick={startTournament}>
                    <img src={tournamentsIcon} alt="Tournament Icon" className="button-icon" />
                    Iniciar Torneio
                  </button>
                )}
                <button className="homePage" onClick={() => setFaseAtual('menu')}>
                  <img src={folderIcon} alt="Folder Icon" className="folder-icon" />
                  Meus Torneios
                </button>
                <button onClick={add8Duplas}>Adicionar 8 Duplas</button>
              </div>
              {manualGroups ? (
                <div className="manual-groups">
                  <h3>Organize os Grupos Manualmente</h3>
                  <div style={{ display: 'flex', gap: '20px' }}>
                    <div>
                      <h4>Duplas Disponíveis</h4>
                      <ul>
                        {currentTournament.duplas
                          .filter((dupla) =>
                            !manualGroups.some((g) => g.duplas.some((d) => d.join('') === dupla.join('')))
                          )
                          .map((dupla, index) => (
                            <li key={index}>
                              {dupla.join(' & ')}
                              {manualGroups.map((grupo) => (
                                grupo.duplas.length < grupo.maxDuplas && (
                                  <button
                                    key={grupo.id}
                                    onClick={() =>
                                      setManualGroups((prev) =>
                                        prev.map((g) =>
                                          g.id === grupo.id ? { ...g, duplas: [...g.duplas, dupla] } : g
                                        )
                                      )
                                    }
                                  >
                                    Adicionar ao Grupo {grupo.id + 1}
                                  </button>
                                )
                              ))}
                            </li>
                          ))}
                      </ul>
                    </div>
                    {manualGroups.map((grupo) => (
                      <div key={grupo.id}>
                        <h4>Grupo {grupo.id + 1} ({grupo.duplas.length}/{grupo.maxDuplas})</h4>
                        <ul>
                          {grupo.duplas.map((dupla, index) => (
                            <li key={index}>
                              {dupla.join(' & ')}
                              <button
                                onClick={() =>
                                  setManualGroups((prev) =>
                                    prev.map((g) =>
                                      g.id === grupo.id
                                        ? { ...g, duplas: g.duplas.filter((d) => d.join('') !== dupla.join('')) }
                                        : g
                                    )
                                  )
                                }
                              >
                                Remover
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                  <button onClick={confirmarChavesManuais}>Confirmar Grupos</button>
                  <button onClick={() => setManualGroups(null)}>Cancelar</button>
                </div>
              ) : (
                <DuplasList
                  duplas={currentTournament?.duplas || []}
                  onAddDupla={addDupla}
                  onRemoveDupla={removeDupla}
                />
              )}
            </div>
          </div>
        )}
        {faseAtual === 'grupos' && (
          <>
            <FaseDeGrupos
              grupos={currentTournament.grupos}
              onUpdateGroups={(newGrupos) => updateTournamentField('grupos', newGrupos)}
            />
            <button onClick={encerrarFaseGrupos}>Encerrar Fase de Grupos</button>
            <button onClick={imprimirSumulasGrupos}>Imprimir Súmulas da Fase de Grupos</button>
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
              onAvancarParaFinal={encerrarFaseEliminatoria}
            />
            <button onClick={() => encerrarFaseEliminatoria(currentTournament.jogosEliminatoria)}>
              Encerrar Etapa
            </button>
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
            <button onClick={() => gerarSumulas('final', currentTournament.jogosEliminatoria.filter(
              (jogo) => jogo.fase === 'Final' || jogo.fase === 'Disputa 3º Lugar'
            ))}>
              Imprimir Súmulas da Fase Final
            </button>
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
                const duplasExibidas = mostrarTodasDuplas ? estatisticasDuplas : estatisticasDuplas.slice(0, 4);

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
                      <>
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
                            {duplasExibidas.map((dupla, index) => (
                              <tr key={index}>
                                <td>{dupla.posicaoRanking !== '-' ? `${dupla.posicaoRanking}º` : '-'}</td>
                                <td>
                                  <div className="dupla-container">
                                    <span>{dupla.dupla.split(' & ')[0]}</span>
                                    <span></span>
                                    <span>{dupla.dupla.split(' & ')[1]}</span>
                                  </div>
                                </td>
                                <td>{dupla.jogos}</td>
                                <td>{dupla.vitorias}</td>
                                <td>{dupla.derrotas}</td>
                                <td>{dupla.gamesVencidos}/{dupla.gamesPerdidos}</td>
                                <td>{dupla.saldoGames}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {estatisticasDuplas.length > 4 && (
                          <button
                            onClick={() => setMostrarTodasDuplas(!mostrarTodasDuplas)}
                            style={{ marginTop: '10px' }}
                          >
                            {mostrarTodasDuplas ? 'Ver menos' : 'Ver mais'}
                          </button>
                        )}
                      </>
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
                                <th>Vencedor</th>
                                <th>Fase</th>
                              </tr>
                            </thead>
                            <tbody>
                              {grupo.jogos
                                .filter((jogo) => jogo.submetido)
                                .map((jogo, index) => {
                                  const [g1, g2] = jogo.placar ? jogo.placar.split('-').map(Number) : [0, 0];
                                  const vencedor = g1 > g2 ? jogo.dupla1 : g2 > g1 ? jogo.dupla2 : null;
                                  return (
                                    <tr key={index}>
                                      <td>{index + 1}</td>
                                      <td>
                                        <div className="dupla-container">
                                          <span>{jogo.dupla1[0]}</span>
                                          <span></span>
                                          <span>{jogo.dupla1[1]}</span>
                                        </div>
                                      </td>
                                      <td>{jogo.placar}</td>
                                      <td>
                                        <div className="dupla-container">
                                          <span>{jogo.dupla2[0]}</span>
                                          <span></span>
                                          <span>{jogo.dupla2[1]}</span>
                                        </div>
                                      </td>
                                      <td>
                                        {vencedor ? (
                                          <div className="dupla-container">
                                            <span>{vencedor[0]}</span>
                                            <span></span>
                                            <span>{vencedor[1]}</span>
                                          </div>
                                        ) : (
                                          'Empate'
                                        )}
                                      </td>
                                      <td>Fase de Grupos</td>
                                    </tr>
                                  );
                                })}
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
                            <th>Vencedor</th>
                            <th>Fase</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentTournament.jogosEliminatoria
                            .filter((jogo) => jogo.submetido && jogo.fase !== 'Final' && jogo.fase !== 'Disputa 3º Lugar')
                            .map((jogo, index) => {
                              let vencedor;
                              if (jogo.dupla1[0] === 'BYE') {
                                vencedor = jogo.dupla2;
                              } else if (jogo.dupla2[0] === 'BYE') {
                                vencedor = jogo.dupla1;
                              } else {
                                const [g1, g2] = jogo.placar.split('-').map(Number);
                                vencedor = g1 > g2 ? jogo.dupla1 : g2 > g1 ? jogo.dupla2 : null;
                              }
                              return (
                                <tr key={index}>
                                  <td>{index + 1}</td>
                                  <td>
                                    <div className="dupla-container">
                                      <span>{jogo.dupla1[0]}</span>
                                      <span></span>
                                      <span>{jogo.dupla1[1]}</span>
                                    </div>
                                  </td>
                                  <td>{jogo.placar}</td>
                                  <td>
                                    <div className="dupla-container">
                                      <span>{jogo.dupla2[0]}</span>
                                      <span></span>
                                      <span>{jogo.dupla2[1]}</span>
                                    </div>
                                  </td>
                                  <td>
                                    {vencedor ? (
                                      <div className="dupla-container">
                                        <span>{vencedor[0]}</span>
                                        <span></span>
                                        <span>{vencedor[1]}</span>
                                      </div>
                                    ) : (
                                      'Empate'
                                    )}
                                  </td>
                                  <td>{jogo.fase}</td>
                                </tr>
                              );
                            })}
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
                            <th>Vencedor</th>
                            <th>Fase</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentTournament.jogosEliminatoria
                            .filter((jogo) => jogo.submetido && (jogo.fase === 'Final' || jogo.fase === 'Disputa 3º Lugar'))
                            .map((jogo, index) => {
                              let vencedor;
                              if (jogo.dupla1[0] === 'BYE') {
                                vencedor = jogo.dupla2;
                              } else if (jogo.dupla2[0] === 'BYE') {
                                vencedor = jogo.dupla1;
                              } else {
                                const [g1, g2] = jogo.placar.split('-').map(Number);
                                vencedor = g1 > g2 ? jogo.dupla1 : g2 > g1 ? jogo.dupla2 : null;
                              }
                              return (
                                <tr key={index}>
                                  <td>{index + 1}</td>
                                  <td>
                                    <div className="dupla-container">
                                      <span>{jogo.dupla1[0]}</span>
                                      <span></span>
                                      <span>{jogo.dupla1[1]}</span>
                                    </div>
                                  </td>
                                  <td>{jogo.placar}</td>
                                  <td>
                                    <div className="dupla-container">
                                      <span>{jogo.dupla2[0]}</span>
                                      <span></span>
                                      <span>{jogo.dupla2[1]}</span>
                                    </div>
                                  </td>
                                  <td>
                                    {vencedor ? (
                                      <div className="dupla-container">
                                        <span>{vencedor[0]}</span>
                                        <span></span>
                                        <span>{vencedor[1]}</span>
                                      </div>
                                    ) : (
                                      'Empate'
                                    )}
                                  </td>
                                  <td>{jogo.fase}</td>
                                </tr>
                              );
                            })}
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