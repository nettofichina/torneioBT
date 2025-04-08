import React from 'react';

import downloadIcon from '../../assets/icons/download.svg';
import uploadIcon from '../../assets/icons/upload.svg';
import ballIcon from '../../assets/icons/ball.svg';


function MeusTorneios({
  tournaments,
  onSelectTournament,
  onCreateNew,
  onDeleteTournament,
  onImportTournaments, // Nova prop para importar torneios
}) {
  const handleDelete = (nome) => {
    if (window.confirm(`Tem certeza que deseja excluir "${nome}"?`)) {
      onDeleteTournament(nome);
    }
  };

  // Função para exportar torneios como JSON
  const handleExport = () => {
    const data = JSON.stringify(tournaments, null, 2); // Converte os torneios para JSON formatado
    const blob = new Blob([data], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'torneios.json'; // Nome do arquivo baixado
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  // Função para importar torneios
  const handleImport = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target.result);
          // Verifica se o formato é um objeto de torneios
          if (typeof importedData === 'object' && !Array.isArray(importedData)) {
            onImportTournaments(importedData); // Passa os torneios importados para o App.js
            alert('Torneios importados com sucesso!');
          } else {
            alert('O arquivo JSON não está no formato esperado.');
          }
        } catch (error) {
          alert('Erro ao importar o arquivo: ' + error.message);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="meus-torneios">
      <h2>Meus Torneios</h2>
      <div className="button-container">
        <button className="criarTorneio" onClick={onCreateNew}>
        <img src={ballIcon} alt="ball Icon" className="ball-icon" />
          Novo Torneio
        </button>
      </div>
      <div className='imports'>
  <button className="exportarTorneio" onClick={handleExport}>
    <img src={uploadIcon} alt="Upload Icon" className="upload-icon" />
    Exportar Torneios
  </button>
  
  {/* Substituímos o <button> por um <label> estilizado */}
  <label className="importarTorneio" htmlFor="import-file">
    <img src={downloadIcon} alt="Download Icon" className="download-icon" />
    Importar Torneios
  </label>
  <input
    id="import-file"
    type="file"
    accept=".json"
    onChange={handleImport}
    style={{ display: 'none' }} // Mantemos o input escondido
  />
      </div>
      {Object.keys(tournaments).length === 0 ? (
        <p>Nenhum torneio salvo ainda.</p>
      ) : (
        <ul>
          {Object.entries(tournaments).map(([nome, data], index) => (
            <li key={nome}>
              <span>
                {`${index + 1} - ${nome}`} ({data.status}) - Criado em{' '}
                {data.dataCriacao
                  ? new Date(data.dataCriacao).toLocaleDateString('pt-BR')
                  : 'Não iniciado'}
              </span>
              <div className="buttonAction">
                <button
                  className="OpenButton"
                  onClick={() => onSelectTournament(nome)}
                >
                  Abrir
                </button>
                <button
                  className="DeleteButton"
                  onClick={() => handleDelete(nome)}
                >
                  Excluir
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default MeusTorneios;