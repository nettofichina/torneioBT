import React, { useState, useEffect } from 'react';
import DuplasList from './components/Duplas/DuplasList';
import FaseDeGrupos from './components/Torneio/FaseDeGrupos';
import FaseEliminatoria from './components/Torneio/FaseEliminatoria';
import { avancarRodadaEliminatoria } from './utils/torneioUtils';
import FaseFinal from './components/Torneio/FaseFinal';
import './App.css';
import { dividirGrupos, criarJogosParaGrupo, classificarDuplasPorDesempate } from './utils/torneioUtils';
import gameDay from './assets/img/game-day.svg'; // Importa a imagem SVG
import btConnectLogo from './assets/img/btConnect.png'; // Importa btConnect
import tournamentsIcon from './assets/icons/tournaments.svg'; // Ícone começar torneio

function App() {
  const [duplas, setDuplas] = useState(() => {
    const savedDuplas = localStorage.getItem('torneioDuplas');
    return savedDuplas ? JSON.parse(savedDuplas) : [];
  });
  const [faseAtual, setFaseAtual] = useState(() => localStorage.getItem('torneioFaseAtual') || 'duplas');
  const [grupos, setGrupos] = useState(() => {
    const savedGrupos = localStorage.getItem('torneioGrupos');
    return savedGrupos ? JSON.parse(savedGrupos) : [];
  });
  const [jogosEliminatoria, setJogosEliminatoria] = useState(() => {
    const savedJogos = localStorage.getItem('torneioJogosEliminatoria');
    return savedJogos ? JSON.parse(savedJogos) : [];
  });
  const [finalConfigurada, setFinalConfigurada] = useState(() => localStorage.getItem('torneioFinalConfigurada') === 'true');
  const [terceiroLugarConfigurado, setTerceiroLugarConfigurado] = useState(() => localStorage.getItem('torneioTerceiroLugarConfigurado') === 'true');
  const [ranking, setRanking] = useState(() => {
    const savedRanking = localStorage.getItem('torneioRanking');
    return savedRanking ? JSON.parse(savedRanking) : [];
  });
  const [duplasBye, setDuplasBye] = useState(() => {
    const savedDuplasBye = localStorage.getItem('torneioDuplasBye');
    return savedDuplasBye ? JSON.parse(savedDuplasBye) : [];
  });
  const [historicoDuplas, setHistoricoDuplas] = useState(() => {
    const savedHistorico = localStorage.getItem('torneioHistoricoDuplas');
    return savedHistorico ? JSON.parse(savedHistorico) : {};
  });
  const [dataCriacaoTorneio, setDataCriacaoTorneio] = useState(() => localStorage.getItem('torneioDataCriacao') || null);
  const [nomeTorneio, setNomeTorneio] = useState(() => localStorage.getItem('torneioNome') || '');
  const [dataInicio, setDataInicio] = useState(() => localStorage.getItem('torneioDataInicio') || '');
  const [horaInicio, setHoraInicio] = useState(() => localStorage.getItem('torneioHoraInicio') || '');

  // Salvar estado no localStorage sempre que houver alterações
  useEffect(() => {
    localStorage.setItem('torneioDuplas', JSON.stringify(duplas));
    localStorage.setItem('torneioFaseAtual', faseAtual);
    localStorage.setItem('torneioGrupos', JSON.stringify(grupos));
    localStorage.setItem('torneioJogosEliminatoria', JSON.stringify(jogosEliminatoria));
    localStorage.setItem('torneioFinalConfigurada', finalConfigurada);
    localStorage.setItem('torneioTerceiroLugarConfigurado', terceiroLugarConfigurado);
    localStorage.setItem('torneioRanking', JSON.stringify(ranking));
    localStorage.setItem('torneioDuplasBye', JSON.stringify(duplasBye));
    localStorage.setItem('torneioHistoricoDuplas', JSON.stringify(historicoDuplas));
    localStorage.setItem('torneioDataCriacao', dataCriacaoTorneio || '');
    localStorage.setItem('torneioNome', nomeTorneio);
    localStorage.setItem('torneioDataInicio', dataInicio);
    localStorage.setItem('torneioHoraInicio', horaInicio);
  }, [
    duplas,
    faseAtual,
    grupos,
    jogosEliminatoria,
    finalConfigurada,
    terceiroLugarConfigurado,
    ranking,
    duplasBye,
    historicoDuplas,
    dataCriacaoTorneio,
    nomeTorneio,
    dataInicio,
    horaInicio
  ]);

  const addDupla = (dupla) => {
    if (!duplas.some(d => d.includes(dupla[0]) || d.includes(dupla[1]))) {
      setDuplas(prevDuplas => [...prevDuplas, dupla]);
    } else {
      alert('Os nomes dos jogadores devem ser únicos. Um ou ambos já estão registrados.');
    }
  };

  const removeDupla = (index) => {
    setDuplas(duplas.filter((_, i) => i !== index));
  };

  const startTournament = () => {
    if (duplas.length < 3) {
      alert('É necessário pelo menos 3 duplas para começar o torneio.');
      return;
    }
    if (!nomeTorneio || !dataInicio || !horaInicio) {
      alert('Por favor, preencha o nome, data e hora de início do torneio.');
      return;
    }
    const [ano, mes, dia] = dataInicio.split('-').map(Number);
    const [hora, minuto] = horaInicio.split(':').map(Number);
    const dataTorneio = new Date(ano, mes - 1, dia, hora, minuto);
    setDataCriacaoTorneio(dataTorneio.toISOString()); // Armazenar como string ISO
  
    const duplasSorteadas = [...duplas].sort(() => Math.random() - 0.5);
    const gruposCriados = dividirGrupos(duplasSorteadas);
  
    const gruposComJogos = gruposCriados.map(grupo => ({
      ...grupo,
      jogos: criarJogosParaGrupo(grupo.duplas, grupo.id)
    }));
    setGrupos(gruposComJogos);
  
    // Inicializar historicoDuplas com todas as duplas
    const historicoInicial = duplasSorteadas.reduce((acc, dupla) => {
      acc[dupla.join('')] = { dupla, pontos: 0, jogos: 0, jogosVencidos: 0, gamesVencidos: 0, gamesPerdidos: 0 };
      return acc;
    }, {});
    setHistoricoDuplas(historicoInicial);
    console.log('Histórico Inicial:', historicoInicial);
  
    setFaseAtual('grupos');
  };

  const encerrarFaseGrupos = () => {
    if (grupos.some(grupo => grupo.jogos.some(jogo => !jogo.submetido))) {
      alert('Todos os jogos devem ser submetidos antes de encerrar a fase de grupos.');
      return;
    }
  
    const todosOsJogos = grupos.flatMap(grupo => grupo.jogos);
    setHistoricoDuplas(prev => {
      const novoHistorico = { ...prev };
      todosOsJogos.forEach(jogo => {
        const [g1, g2] = jogo.placar.split('-').map(Number);
        const chave1 = jogo.dupla1.join('');
        const chave2 = jogo.dupla2.join('');
        if (!novoHistorico[chave1]) novoHistorico[chave1] = { dupla: jogo.dupla1, pontos: 0, jogos: 0, jogosVencidos: 0, gamesVencidos: 0, gamesPerdidos: 0 };
        if (!novoHistorico[chave2]) novoHistorico[chave2] = { dupla: jogo.dupla2, pontos: 0, jogos: 0, jogosVencidos: 0, gamesVencidos: 0, gamesPerdidos: 0 };
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
      console.log('Histórico após Fase de Grupos:', novoHistorico);
      console.log('Total de jogos registrados na fase de grupos:', todosOsJogos.length);
      return novoHistorico;
    });
  
    if (duplas.length <= 5) {
      const todosOsJogos = grupos.flatMap(grupo => grupo.jogos);
      const classificados = classificarDuplasPorDesempate(duplas, todosOsJogos);
      alert(`Campeão: ${classificados[0].join(' e ')}`);
      setFaseAtual('finalizado');
    } else if (duplas.length === 10) {
      const rankingGrupo1 = classificarDuplasPorDesempate(grupos[0].duplas, grupos[0].jogos);
      const rankingGrupo2 = classificarDuplasPorDesempate(grupos[1].duplas, grupos[1].jogos);
      const semifinalMatches = [
        { dupla1: rankingGrupo1[0], dupla2: rankingGrupo2[1], placar: '', submetido: false, fase: 'Semifinal', rodada: 1 },
        { dupla1: rankingGrupo2[0], dupla2: rankingGrupo1[1], placar: '', submetido: false, fase: 'Semifinal', rodada: 1 }
      ];
      setJogosEliminatoria(semifinalMatches);
      setFaseAtual('eliminatória');
    } else if (duplas.length <= 8) {
      const rankingGrupo1 = classificarDuplasPorDesempate(grupos[0].duplas, grupos[0].jogos);
      const rankingGrupo2 = classificarDuplasPorDesempate(grupos[1].duplas, grupos[1].jogos);
      const semifinalMatches = [
        { dupla1: rankingGrupo1[0], dupla2: rankingGrupo2[1], placar: '', submetido: false, fase: 'Semifinal', rodada: 1 },
        { dupla1: rankingGrupo2[0], dupla2: rankingGrupo1[1], placar: '', submetido: false, fase: 'Semifinal', rodada: 1 }
      ];
      setJogosEliminatoria(semifinalMatches);
      setFaseAtual('eliminatória');
    } else {
      const classificadosPorGrupo = grupos.map(grupo => {
        return classificarDuplasPorDesempate(grupo.duplas, grupo.jogos).slice(0, 2);
      }).flat();
  
      const duplasUnicas = classificadosPorGrupo.filter((dupla, index, self) =>
        index === self.findIndex(d => d[0] === dupla[0] && d[1] === dupla[1])
      );
  
      const todosOsJogos = grupos.flatMap(grupo => grupo.jogos);
      const jogosClassificados = todosOsJogos.filter(jogo => {
        if (!jogo.dupla1 || !jogo.dupla2 || !Array.isArray(jogo.dupla1) || !Array.isArray(jogo.dupla2)) {
          console.error('Jogo inválido encontrado:', jogo);
          return false;
        }
        const dupla1Str = jogo.dupla1.join('');
        const dupla2Str = jogo.dupla2.join('');
        return duplasUnicas.some(d => d.join('') === dupla1Str) && duplasUnicas.some(d => d.join('') === dupla2Str);
      });
  
      console.log('Duplas classificadas:', duplasUnicas);
      console.log('Jogos classificados:', jogosClassificados);
  
      const rankingGeral = classificarDuplasPorDesempate(duplasUnicas, jogosClassificados);
  
      if (duplas.length <= 11) {
        const duplasByeLocal = rankingGeral.slice(0, 2);
        const duplasQuartas = rankingGeral.slice(2, 6);
  
        if (duplasQuartas.length < 4) {
          console.error('Erro: Menos de 4 duplas para as quartas:', duplasQuartas);
          alert('Erro ao configurar as quartas de final. Verifique os dados.');
          return;
        }
  
        const jogosQuartas = [
          { dupla1: [...duplasQuartas[0]], dupla2: [...duplasQuartas[1]], placar: '', submetido: false, fase: 'Quartas de Final', rodada: 1 },
          { dupla1: [...duplasQuartas[2]], dupla2: [...duplasQuartas[3]], placar: '', submetido: false, fase: 'Quartas de Final', rodada: 1 }
        ];
  
        setJogosEliminatoria(jogosQuartas);
        setDuplasBye(duplasByeLocal);
      } else {
        const top16 = rankingGeral.slice(0, 16);
        const jogosOitavas = [];
        for (let i = 0; i < top16.length; i += 2) {
          jogosOitavas.push({
            dupla1: [...top16[i]],
            dupla2: [...top16[i + 1]],
            placar: '',
            submetido: false,
            fase: 'Oitavas de Final',
            rodada: 1
          });
        }
  
        setJogosEliminatoria(jogosOitavas);
        setDuplasBye([]);
      }
      setFaseAtual('eliminatória');
    }
  };

  const atualizarPlacarNaEliminatoria = (jogo, placar) => {
    if (jogo.dupla1[0] === 'BYE' || jogo.dupla2[0] === 'BYE') {
      setJogosEliminatoria(prevJogos =>
        prevJogos.map(j =>
          j === jogo ? { ...j, placar: 'BYE', submetido: true } : j
        )
      );
      return;
    }
    setJogosEliminatoria(prevJogos => {
      const updatedJogos = prevJogos.map(j =>
        j === jogo ? { ...j, placar: placar, submetido: true } : j
      );
  
      setHistoricoDuplas(prev => {
        const novoHistorico = { ...prev };
        const [g1, g2] = placar.split('-').map(Number);
        const chave1 = jogo.dupla1.join('');
        const chave2 = jogo.dupla2.join('');
        if (!novoHistorico[chave1]) novoHistorico[chave1] = { dupla: jogo.dupla1, pontos: 0, jogos: 0, jogosVencidos: 0, gamesVencidos: 0, gamesPerdidos: 0 };
        if (!novoHistorico[chave2]) novoHistorico[chave2] = { dupla: jogo.dupla2, pontos: 0, jogos: 0, jogosVencidos: 0, gamesVencidos: 0, gamesPerdidos: 0 };
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
        console.log('Histórico após Eliminatória (jogo):', novoHistorico);
        return novoHistorico;
      });
  
      return updatedJogos;
    });
  };

  const iniciarFinal = (jogos) => {
    const semifinalGames = jogos.filter(jogo => jogo.fase === 'Semifinal');
    if (semifinalGames.length !== 2) {
      console.error('Erro: Esperados 2 jogos de semifinal.');
      return;
    }

    const finalistas = semifinalGames.map(jogo => {
      const [set1, set2] = jogo.placar.split('-').map(Number);
      return set1 > set2 ? jogo.dupla1 : jogo.dupla2;
    });

    const perdedores = semifinalGames.map(jogo => {
      const [set1, set2] = jogo.placar.split('-').map(Number);
      return set1 > set2 ? jogo.dupla2 : jogo.dupla1;
    });

    setJogosEliminatoria(prev => [
      ...prev,
      {
        dupla1: finalistas[0],
        dupla2: finalistas[1],
        placar: '',
        submetido: false,
        fase: 'Final',
        rodada: Math.max(...prev.map(j => j.rodada)) + 1
      },
      {
        dupla1: perdedores[0],
        dupla2: perdedores[1],
        placar: '',
        submetido: false,
        fase: 'Disputa 3º Lugar',
        rodada: Math.max(...prev.map(j => j.rodada)) + 1
      }
    ]);
    setFinalConfigurada(true);
    setTerceiroLugarConfigurado(true);
  };

  const atualizarPlacarNaFinal = (jogo, placar) => {
    setJogosEliminatoria(prevJogos => {
      const updatedJogos = prevJogos.map(j =>
        j === jogo ? { ...j, placar: placar, submetido: true } : j
      );
  
      setHistoricoDuplas(prev => {
        const novoHistorico = { ...prev };
        const [g1, g2] = placar.split('-').map(Number);
        const chave1 = jogo.dupla1.join('');
        const chave2 = jogo.dupla2.join('');
        if (!novoHistorico[chave1]) novoHistorico[chave1] = { dupla: jogo.dupla1, pontos: 0, jogos: 0, jogosVencidos: 0, gamesVencidos: 0, gamesPerdidos: 0 };
        if (!novoHistorico[chave2]) novoHistorico[chave2] = { dupla: jogo.dupla2, pontos: 0, jogos: 0, jogosVencidos: 0, gamesVencidos: 0, gamesPerdidos: 0 };
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
        console.log('Histórico após Final (jogo):', novoHistorico);
        return novoHistorico;
      });
  
      return updatedJogos;
    });
  };

  const encerrarFaseEliminatoria = () => {
    const rodadaAtual = Math.max(...jogosEliminatoria.map(j => j.rodada));
    const jogosRodadaAtual = jogosEliminatoria.filter(j => j.rodada === rodadaAtual);

    if (!jogosRodadaAtual.every(j => j.submetido)) {
      alert('Todos os jogos da rodada atual devem ser submetidos antes de avançar.');
      return;
    }

    console.log('Jogos da rodada atual:', jogosRodadaAtual);
    console.log('Duplas BYE:', duplasBye);
    console.log('Historico Duplas:', historicoDuplas);

    if (jogosRodadaAtual.some(j => j.fase === 'Semifinal') && !finalConfigurada) {
      iniciarFinal(jogosEliminatoria);
      setFaseAtual('final');
    } else if (jogosRodadaAtual.some(j => j.fase === 'Quartas de Final') && duplas.length <= 11) {
      const vencedoresQuartas = jogosRodadaAtual.map(jogo => {
        const [set1, set2] = jogo.placar.split('-').map(Number);
        return set1 > set2 ? jogo.dupla1 : jogo.dupla2;
      });

      if (duplasBye.length !== 2) {
        alert('Erro: Duplas com BYE não encontradas.');
        console.log('duplasBye:', duplasBye);
        console.log('Vencedores Quartas:', vencedoresQuartas);
        return;
      }

      const semifinalMatches = [
        { dupla1: [...duplasBye[0]], dupla2: [...vencedoresQuartas[0]], placar: '', submetido: false, fase: 'Semifinal', rodada: rodadaAtual + 1 },
        { dupla1: [...duplasBye[1]], dupla2: [...vencedoresQuartas[1]], placar: '', submetido: false, fase: 'Semifinal', rodada: rodadaAtual + 1 }
      ];
      setJogosEliminatoria(prev => {
        const updated = [...prev.filter(j => j.rodada < rodadaAtual + 1), ...semifinalMatches];
        console.log('Novo estado jogosEliminatoria:', updated);
        return updated;
      });
    } else if (jogosRodadaAtual.length > 1) {
      const novaRodada = avancarRodadaEliminatoria(jogosRodadaAtual);
      setJogosEliminatoria(prev => {
        const updated = [...prev.filter(j => j.rodada < rodadaAtual + 1), ...novaRodada];
        console.log('Novo estado jogosEliminatoria:', updated);
        return updated;
      });
    } else {
      alert('Não há mais rodadas para avançar.');
    }
  };

  const finalizarTorneio = () => {
    const final = jogosEliminatoria.find(jogo => jogo.fase === 'Final');
    const terceiroLugar = jogosEliminatoria.find(jogo => jogo.fase === 'Disputa 3º Lugar');

    if (!final || !terceiroLugar || !final.placar || !terceiroLugar.placar) {
      alert('Erro: Final ou Disputa de 3º Lugar não estão completos.');
      console.log('jogosEliminatoria:', jogosEliminatoria);
      return;
    }

    const [finalSet1, finalSet2] = final.placar.split('-').map(Number);
    const [vencedorFinal, perdedorFinal] = finalSet1 > finalSet2
      ? [final.dupla1, final.dupla2]
      : [final.dupla2, final.dupla1];

    const [terceiroSet1, terceiroSet2] = terceiroLugar.placar.split('-').map(Number);
    const [terceiro, quarto] = terceiroSet1 > terceiroSet2
      ? [terceiroLugar.dupla1, terceiroLugar.dupla2]
      : [terceiroLugar.dupla2, terceiroLugar.dupla1];

    setRanking([
      { lugar: 1, dupla: vencedorFinal },
      { lugar: 2, dupla: perdedorFinal },
      { lugar: 3, dupla: terceiro },
      { lugar: 4, dupla: quarto }
    ]);
    setFaseAtual('finalizado');
  };

  const renderClassificacaoGrupo = (grupo) => {
    const ranking = classificarDuplasPorDesempate(grupo.duplas, grupo.jogos);
    const todosSubmetidos = grupo.jogos.every(jogo => jogo.submetido);

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
              const jogosDupla = grupo.jogos.filter(j =>
                j.dupla1.join('') === dupla.join('') || j.dupla2.join('') === dupla.join('')
              );
              const jogosVencidos = jogosDupla.filter(j => {
                if (!j.placar) return false;
                const [g1, g2] = j.placar.split('-').map(Number);
                return j.dupla1.join('') === dupla.join('') ? g1 > g2 : g2 > g1;
              }).length;
              const jogosPerdidos = jogosDupla.filter(j => {
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
              const vencedor = jogo.placar ? (g1 > g2 ? jogo.dupla1.join(' & ') : g2 > g1 ? jogo.dupla2.join(' & ') : 'Empate') : 'A definir';
              const incrementoMinutos = idx * 30;
              const dataHora = formatarDataHora(dataCriacaoTorneio, incrementoMinutos);
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
    const rodadas = [...new Set(jogos.map(j => j.rodada))].sort((a, b) => a - b);
    return rodadas.map(rodada => {
      const jogosDaRodada = jogos.filter(j => j.rodada === rodada);
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
                const vencedor = jogo.placar && jogo.submetido
                  ? (parseInt(jogo.placar.split('-')[0]) > parseInt(jogo.placar.split('-')[1]) ? jogo.dupla1.join(' & ') : jogo.dupla2.join(' & '))
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
      ...grupos.flatMap(grupo => grupo.jogos),
      ...jogosEliminatoria.filter(jogo => jogo.placar !== 'BYE')
    ].filter(jogo => jogo.submetido);
  
    const totalPartidas = todosOsJogos.length;
    const totalGames = todosOsJogos.reduce((acc, jogo) => {
      const [g1, g2] = jogo.placar.split('-').map(Number);
      return acc + g1 + g2;
    }, 0);
  
    const estatisticasDuplas = Object.values(historicoDuplas).map(dados => {
      const aproveitamento = dados.jogos > 0 ? ((dados.jogosVencidos / dados.jogos) * 100).toFixed(2) : 0;
      const saldoGames = dados.gamesVencidos - dados.gamesPerdidos;
      const posicaoRanking = ranking.find(r => r.dupla.join('') === dados.dupla.join(''))?.lugar || '-';
      return {
        dupla: dados.dupla.join(' & '),
        jogos: dados.jogos,
        vitorias: dados.jogosVencidos,
        gamesVencidos: dados.gamesVencidos,
        gamesPerdidos: dados.gamesPerdidos,
        saldoGames,
        aproveitamento,
        posicaoRanking
      };
    }).sort((a, b) => {
      if (a.posicaoRanking === '-' && b.posicaoRanking !== '-') return 1;
      if (b.posicaoRanking === '-' && a.posicaoRanking !== '-') return -1;
      if (a.posicaoRanking !== '-' && b.posicaoRanking !== '-') return a.posicaoRanking - b.posicaoRanking;
      return b.saldoGames - a.saldoGames;
    });
  
    const melhorCampanha = estatisticasDuplas.reduce((melhor, atual) => {
      return atual.saldoGames > melhor.saldoGames ? atual : melhor;
    }, estatisticasDuplas[0] || { dupla: 'Nenhuma', vitorias: 0, jogos: 0, saldoGames: 0 });
  
    console.log('Estatísticas por Dupla:', estatisticasDuplas);
    console.log('Melhor Campanha Calculada:', melhorCampanha);
  
    return {
      totalPartidas,
      totalGames,
      estatisticasDuplas,
      melhorCampanha
    };
  };

  const resetTournament = () => {
    localStorage.clear();
    setDuplas([]);
    setFaseAtual('duplas');
    setGrupos([]);
    setJogosEliminatoria([]);
    setFinalConfigurada(false);
    setTerceiroLugarConfigurado(false);
    setRanking([]);
    setDuplasBye([]);
    setHistoricoDuplas({});
    setDataCriacaoTorneio(null);
    setNomeTorneio('');
    setDataInicio('');
    setHoraInicio('');
  };

  const add8Duplas = () => {
    const newDuplas = [];
    for (let i = 1; i <= 8; i++) {
      newDuplas.push([`JOGADOR${i * 2 - 1}`, `JOGADOR${i * 2}`]);
    }
    setDuplas(prevDuplas => [...prevDuplas, ...newDuplas]);
  };

  const add27Duplas = () => {
    const newDuplas = [];
    for (let i = 1; i <= 27; i++) {
      newDuplas.push([`Jogador${i * 2 - 1}`, `Jogador${i * 2}`]);
    }
    setDuplas(newDuplas);
  };

  return (
    <div className="App">
      <header>
        <img src={btConnectLogo} alt="btConnect Logo" className="header-logo" />
      </header>
      <main>
        {faseAtual === 'duplas' && (
          <div className="tournament-setup">
            <div className="input-section">
              <div className="input-container">
                <label>Nome do Torneio:</label>
                <input
                  type="text"
                  value={nomeTorneio}
                  onChange={(e) => setNomeTorneio(e.target.value.toUpperCase())}
                  placeholder="Nome do torneio"
                />
              </div>
              <div className="input-container">
                <label>Data de Início:</label>
                <input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                />
              </div>
              <div className="input-container">
                <label>Hora de Início:</label>
                <input
                  type="time"
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                />
              </div>
            </div>
            <div className="image-section">
              <img src={gameDay} alt="Game Day" className="tournament-image" />
            </div>
            <div className="duplas-section">
              <div className="button-container">
                <button className="iniciar-torneio" onClick={startTournament}>
                  <img src={tournamentsIcon} alt="Tournament Icon" className="button-icon" />
                  Iniciar Torneio
                </button>
                <button onClick={add8Duplas}>Adicionar 8 Duplas</button>
                <button onClick={add27Duplas}>Adicionar 27 Duplas</button>
              </div>
              <DuplasList duplas={duplas} onAddDupla={addDupla} onRemoveDupla={removeDupla} />
            </div>
          </div>
        )}
        {faseAtual === 'grupos' && (
          <>
            <FaseDeGrupos grupos={grupos} onUpdateGroups={setGrupos} />
            <button onClick={encerrarFaseGrupos}>Encerrar Fase de Grupos</button>
            <div className="acompanhamento">
              <h2>Acompanhamento - Fase de Grupos</h2>
              {grupos.map(grupo => renderClassificacaoGrupo(grupo))}
            </div>
          </>
        )}
        {faseAtual === 'eliminatória' && (
          <>
            <h2>Fase Eliminatória</h2>
            <FaseEliminatoria
              jogos={jogosEliminatoria.filter(jogo => !jogo.submetido || jogo.rodada === Math.max(...jogosEliminatoria.map(j => j.rodada)))}
              onAtualizarPlacar={atualizarPlacarNaEliminatoria}
            />
            <button onClick={encerrarFaseEliminatoria}>Encerrar Etapa</button>
            <div className="acompanhamento">
              <h2>Acompanhamento - Fase Eliminatória</h2>
              {renderizarFaseEliminatoria(jogosEliminatoria)}
            </div>
          </>
        )}
        {faseAtual === 'final' && (
          <>
            <h2>Final do Torneio</h2>
            <FaseFinal
              jogos={jogosEliminatoria.filter(jogo => jogo.fase === 'Final' || jogo.fase === 'Disputa 3º Lugar')}
              onAtualizarPlacar={atualizarPlacarNaFinal}
              onFinalizarTorneio={finalizarTorneio}
            />
            {terceiroLugarConfigurado}
            {jogosEliminatoria.filter(jogo => jogo.fase === 'Final' || jogo.fase === 'Disputa 3º Lugar').every(jogo => jogo.submetido) && (
              <button onClick={finalizarTorneio}>Encerrar Campeonato</button>
            )}
            <div className="acompanhamento">
              <h2>Acompanhamento - Fase Final</h2>
              {renderizarFaseEliminatoria(jogosEliminatoria.filter(jogo => jogo.fase === 'Final' || jogo.fase === 'Disputa 3º Lugar'))}
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
        {ranking.map((posição, index) => {
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
        const { totalPartidas, totalGames, estatisticasDuplas, melhorCampanha } = gerarRelatorioEstatisticas();
        return (
          <>
            <p><strong>Total de Partidas Disputadas:</strong> {totalPartidas}</p>
            <p><strong>Total de Games Disputados:</strong> {totalGames}</p>
            <p><strong>Melhor Campanha:</strong> {melhorCampanha.dupla} (Saldo de Games: {melhorCampanha.saldoGames}, {melhorCampanha.vitorias} vitórias em {melhorCampanha.jogos} jogos)</p>
            <h4>Estatísticas por Dupla</h4>
            <table>
              <thead>
                <tr>
                  <th>POSIÇÃO</th>
                  <th>DUPLA</th>
                  <th>PARTIDAS</th>
                  <th>VITÓRIAS</th>
                  <th>GAMES (V/P)</th>
                  <th>SALDO GAMES</th>
                  <th>APROVEITAMENTO</th>
                </tr>
              </thead>
              <tbody>
                {estatisticasDuplas.map((dupla, index) => (
                  <tr key={index}>
                    <td>{dupla.posicaoRanking !== '-' ? `${dupla.posicaoRanking}º` : '-'}</td>
                    <td>{dupla.dupla}</td>
                    <td>{dupla.jogos}</td>
                    <td>{dupla.vitorias}</td>
                    <td>{dupla.gamesVencidos}/{dupla.gamesPerdidos}</td>
                    <td>{dupla.saldoGames}</td>
                    <td>{dupla.aproveitamento}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p>Torneio Finalizado em {new Date().toLocaleString('pt-BR')}!</p>
            <button onClick={resetTournament} className="novo-torneio-btn">Início</button>
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