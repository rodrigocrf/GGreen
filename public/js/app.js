/**
 * GGREEN // Lógica Principal do Terminal Cliente
 * Foco: Gestão de Risco Finaceiro & Precificação Estatística
 */

document.addEventListener('DOMContentLoaded', () => {
  initTerminal();
});

// Cache de elementos do DOM
const DOM = {
  statusDot: document.getElementById('system-status-indicator')?.querySelector('.status-dot'),
  statusText: document.getElementById('status-text'),
  liveTimer: document.getElementById('live-timer'),
  consoleLogs: document.getElementById('console-log-lines'),

  // Calculadora de Risco
  inputBank: document.getElementById('input-bank'),
  inputOdds: document.getElementById('input-odds'),
  inputProbability: document.getElementById('input-probability'),
  btnCalculateRisk: document.getElementById('btn-calculate-risk'),
  riskBar: document.getElementById('risk-bar'),
  resultStakePercent: document.getElementById('result-stake-percent'),
  resultStakeValue: document.getElementById('result-stake-value'),
  resultEvaluation: document.getElementById('result-evaluation'),

  // Estimador de True Odds
  inputXgHome: document.getElementById('input-xg-home'),
  inputXgaHome: document.getElementById('input-xga-home'),
  inputXgAway: document.getElementById('input-xg-away'),
  inputXgaAway: document.getElementById('input-xga-away'),
  btnEstimateOdds: document.getElementById('btn-estimate-odds'),
  pricingResults: document.getElementById('pricing-results-container'),
  probHome: document.getElementById('prob-home'),
  oddHome: document.getElementById('odd-home'),
  probDraw: document.getElementById('prob-draw'),
  oddDraw: document.getElementById('odd-draw'),
  probAway: document.getElementById('prob-away'),
  oddAway: document.getElementById('odd-away'),

  // Tooltip de Ajuda
  helpTooltip: document.getElementById('help-tooltip'),

  // Botões de Limpeza
  btnClearFinance: document.getElementById('btn-clear-finance'),
  btnClearPricing: document.getElementById('btn-clear-pricing'),

  // Seletores de Times e Carregamento de Dados
  selectLeague: document.getElementById('select-league'),
  selectHomeTeam: document.getElementById('select-home-team'),
  selectAwayTeam: document.getElementById('select-away-team'),
  btnLoadStats: document.getElementById('btn-load-stats'),
};

/**
 * Inicialização de monitoramento e logs no terminal
 */
async function initTerminal() {
  startTimer();
  addLog('Conectando-se ao core da API GGreen...', 'info');

  try {
    const response = await fetch('/api/v1/health');
    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        setSystemOnline(true);
        addLog(`Conectado à API com sucesso. Status do Servidor: ${data.status}`, 'success');
      }
    } else {
      setSystemOnline(false);
      addLog('API retornou código de erro inesperado.', 'error');
    }
  } catch (error) {
    setSystemOnline(false);
    addLog('API offline. Executando em modo local autônomo.', 'warning');
  }

  // Configura os event listeners
  if (DOM.btnCalculateRisk) {
    DOM.btnCalculateRisk.addEventListener('click', calculateKellyRisk);
  }
  if (DOM.btnEstimateOdds) {
    DOM.btnEstimateOdds.addEventListener('click', calculatePoissonOdds);
  }
  if (DOM.btnClearFinance) {
    DOM.btnClearFinance.addEventListener('click', clearFinanceFields);
  }
  if (DOM.btnClearPricing) {
    DOM.btnClearPricing.addEventListener('click', clearPricingFields);
  }
  if (DOM.btnLoadStats) {
    DOM.btnLoadStats.addEventListener('click', loadSelectedTeamStats);
  }
  if (DOM.selectLeague) {
    DOM.selectLeague.addEventListener('change', filterTeamsByLeague);
  }

  // Inicializa a carga de times
  loadTeamsData();

  // Ativa os botões explicativos (?)
  setupHelpTooltips();
}

/**
 * Atualiza o timer em tempo real (retro-terminal feel)
 */
function startTimer() {
  setInterval(() => {
    const now = new Date();
    const timeString = now.toTimeString().split(' ')[0];
    if (DOM.liveTimer) {
      DOM.liveTimer.textContent = timeString;
    }
  }, 1000);
}

/**
 * Define o estado visual do status da API
 */
function setSystemOnline(online) {
  if (!DOM.statusDot || !DOM.statusText) return;
  if (online) {
    DOM.statusDot.classList.add('active');
    DOM.statusText.textContent = 'ONLINE';
    DOM.statusText.className = 'text-success';
  } else {
    DOM.statusDot.classList.remove('active');
    DOM.statusText.textContent = 'STANDALONE';
    DOM.statusText.className = 'text-warning';
  }
}

/**
 * Adiciona uma linha de log no terminal de console com segurança (textContent)
 */
function addLog(message, type = 'info') {
  if (!DOM.consoleLogs) return;

  const line = document.createElement('div');
  line.className = 'log-line';

  const prefix = document.createElement('span');
  prefix.className = 'text-dim';
  prefix.textContent = `> [${new Date().toTimeString().split(' ')[0]}] `;
  line.appendChild(prefix);

  const textNode = document.createElement('span');
  textNode.textContent = message;

  if (type === 'success') textNode.className = 'text-success';
  if (type === 'error') textNode.className = 'text-error';
  if (type === 'warning') textNode.className = 'text-warning';

  line.appendChild(textNode);
  DOM.consoleLogs.appendChild(line);

  // Rola logs para baixo automaticamente
  DOM.consoleLogs.scrollTop = DOM.consoleLogs.scrollHeight;
}

/**
 * Lógica do Algoritmo: Critério de Kelly Fracionado
 */
function calculateKellyRisk() {
  const bank = parseFloat(DOM.inputBank.value);
  const odds = parseFloat(DOM.inputOdds.value);
  const probabilityPercent = parseFloat(DOM.inputProbability.value);

  // Validação segura de Inputs
  if (isNaN(bank) || bank <= 0) {
    showInputError(DOM.inputBank, 'Insira um valor de banca válido.');
    return;
  }
  if (isNaN(odds) || odds <= 1.01) {
    showInputError(DOM.inputOdds, 'A odd deve ser maior que 1.01.');
    return;
  }
  if (isNaN(probabilityPercent) || probabilityPercent < 1 || probabilityPercent > 99) {
    showInputError(DOM.inputProbability, 'Probabilidade deve estar entre 1% e 99%.');
    return;
  }

  addLog(`Iniciando simulação financeira para Odd ${odds.toFixed(2)} e Probabilidade ${probabilityPercent}%...`, 'info');

  const p = probabilityPercent / 100;      // Probabilidade de sucesso
  const q = 1 - p;                          // Probabilidade de falha
  const b = odds - 1;                       // Odd líquida (ganho líquido por unidade apostada)

  // Fórmula do Critério de Kelly Tradicional: f* = (p * b - q) / b
  const kellyFull = (p * b - q) / b;

  if (kellyFull <= 0) {
    renderZeroRiskResult('Aposta sem valor matemático esperado (-EV). Entrada recomendada: R$ 0.00 (Aborte).', 'danger');
    addLog('Simulação rejeitada: Valor Esperado Negativo (-EV).', 'error');
    return;
  }

  // Obter fração selecionada com segurança
  const checkedFractionInput = document.querySelector('input[name="kelly-fraction"]:checked');
  const fraction = checkedFractionInput ? parseFloat(checkedFractionInput.value) : 0.25;

  // Kelly Fracionado
  const kellyFractional = kellyFull * fraction;
  const stakePercent = kellyFractional * 100;
  const stakeValue = bank * kellyFractional;

  // Renderiza resultados com textContent seguro
  DOM.resultStakePercent.textContent = `${stakePercent.toFixed(2)}%`;
  DOM.resultStakeValue.textContent = `R$ ${stakeValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Classifica os níveis de risco de acordo com regras-negocio.md
  let riskClass = 'text-safe';
  let evaluationText = '';

  if (stakePercent <= 1.5) {
    riskClass = 'text-safe';
    evaluationText = '🟢 APOSTA SEGURA: Alocação confortável ajustada à banca e ao risco.';
    addLog(`Investimento seguro calculado: ${stakePercent.toFixed(2)}% da banca.`, 'success');
  } else if (stakePercent <= 5.0) {
    riskClass = 'text-warning';
    evaluationText = '🟡 ALOCAÇÃO MODERADA: Stake ajustada ao Critério de Kelly. Prossiga com atenção.';
    addLog(`Investimento moderado calculado: ${stakePercent.toFixed(2)}% da banca.`, 'warning');
  } else {
    riskClass = 'text-danger';
    evaluationText = '🔴 ALERTA DE RISCO ALTO: Esta aposta excede 5% de sua banca. Alto risco de ruína financeira!';
    addLog(`ALERTA: Stake sugerida muito alta (${stakePercent.toFixed(2)}%). Risco financeiro crítico!`, 'error');
  }

  DOM.resultEvaluation.textContent = evaluationText;
  DOM.resultEvaluation.className = `tile-value ${riskClass}`;

  // Atualiza graficamente o termômetro de risco
  // Mapeamos 10% da banca para 100% da largura visual do termômetro para melhor resolução
  const visualPercent = Math.min((stakePercent / 10) * 100, 100);
  DOM.riskBar.style.width = `${visualPercent}%`;
}

function renderZeroRiskResult(message, type) {
  DOM.resultStakePercent.textContent = '0.00%';
  DOM.resultStakeValue.textContent = 'R$ 0,00';
  DOM.resultEvaluation.textContent = message;
  DOM.resultEvaluation.className = `tile-value text-${type}`;
  DOM.riskBar.style.width = '0%';
}

function showInputError(inputElement, errorMessage) {
  addLog(`Erro de entrada: ${errorMessage}`, 'error');
  inputElement.focus();
  inputElement.style.borderColor = 'var(--accent-danger)';
  setTimeout(() => {
    inputElement.style.borderColor = '';
  }, 3000);
}

/**
 * Lógica do Algoritmo: Distribuição de Poisson baseada em xG
 * Para estimar a probabilidade das três vias (V-E-D) do futebol
 */
function calculatePoissonOdds() {
  const xgHome = parseFloat(DOM.inputXgHome.value);
  const xgaHome = parseFloat(DOM.inputXgaHome.value);
  const xgAway = parseFloat(DOM.inputXgAway.value);
  const xgaAway = parseFloat(DOM.inputXgaAway.value);

  // Validação segura de inputs
  if (isNaN(xgHome) || xgHome < 0 ||
    isNaN(xgaHome) || xgaHome < 0 ||
    isNaN(xgAway) || xgAway < 0 ||
    isNaN(xgaAway) || xgaAway < 0) {
    addLog('Erro: Insira valores válidos de xG e xGA (maiores ou iguais a 0).', 'error');
    return;
  }

  addLog(`Calculando True Odds (Fase 1 - Poisson) para o confronto...`, 'info');

  // Média de gols esperados na partida baseado nas forças ofensivas/defensivas
  // Mandante espera marcar: média do seu ataque vs defesa do visitante
  const lambda = xgHome;
  // Visitante espera marcar: média do seu ataque vs defesa do mandante
  const mu = xgAway;

  // Calculamos a distribuição para placares de até 6 gols para cada equipe
  const maxGols = 6;
  const probHomeGoals = new Array(maxGols + 1);
  const probAwayGoals = new Array(maxGols + 1);

  for (let i = 0; i <= maxGols; i++) {
    probHomeGoals[i] = poisson(i, lambda);
    probAwayGoals[i] = poisson(i, mu);
  }

  // Cruzamos a matriz de probabilidades
  let probWinHome = 0;
  let probDraw = 0;
  let probWinAway = 0;

  for (let h = 0; h <= maxGols; h++) {
    for (let a = 0; a <= maxGols; a++) {
      const probMatch = probHomeGoals[h] * probAwayGoals[a];
      if (h > a) {
        probWinHome += probMatch;
      } else if (h === a) {
        probDraw += probMatch;
      } else {
        probWinAway += probMatch;
      }
    }
  }

  // Normalização caso a soma não dê exatamente 1 (devido ao teto de 6 gols)
  const totalProb = probWinHome + probDraw + probWinAway;
  probWinHome /= totalProb;
  probDraw /= totalProb;
  probWinAway /= totalProb;

  // True Odds (1 / probabilidade)
  const oddH = probWinHome > 0.001 ? (1 / probWinHome) : 999;
  const oddD = probDraw > 0.001 ? (1 / probDraw) : 999;
  const oddA = probWinAway > 0.001 ? (1 / probWinAway) : 999;

  // Atualiza a tela com textContent (segurança XSS)
  DOM.probHome.textContent = `${(probWinHome * 100).toFixed(1)}%`;
  DOM.oddHome.textContent = `Odd: ${oddH.toFixed(2)}`;

  DOM.probDraw.textContent = `${(probDraw * 100).toFixed(1)}%`;
  DOM.oddDraw.textContent = `Odd: ${oddD.toFixed(2)}`;

  DOM.probAway.textContent = `${(probWinAway * 100).toFixed(1)}%`;
  DOM.oddAway.textContent = `Odd: ${oddA.toFixed(2)}`;

  // Exibe a seção de resultados
  DOM.pricingResults.style.display = 'block';

  addLog(`Partida precificada com sucesso! True Odds calculadas: [1]: ${oddH.toFixed(2)} | [X]: ${oddD.toFixed(2)} | [2]: ${oddA.toFixed(2)}`, 'success');
}

/**
 * Função matemática de distribuição de Poisson: P(k; L) = (L^k * e^-L) / k!
 */
function poisson(k, lambda) {
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
}

/**
 * Fatorial básico recursivo otimizado por cache para os limites de 6 gols
 */
const factorialCache = [1, 1, 2, 6, 24, 120, 720];
function factorial(n) {
  if (n < 0) return 0;
  if (factorialCache[n] !== undefined) {
    return factorialCache[n];
  }
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}

// --------------------------------------------------------------------------
// LÓGICA DE EXPLICABILIDADE DE MÉTRICAS (TOOLTIPS)
// --------------------------------------------------------------------------

// Dicionário de explicações de métricas para usuários leigos
const HELP_TEXTS = {
  bank: 'Banca Total: Todo o dinheiro que você tem reservado na sua carteira de investimentos exclusivo para apostar. Esse valor serve de base para o cálculo de quanto você pode investir em cada jogada.',
  odds: 'Odd da Casa: A cotação oferecida pela casa de apostas (ex: 2.00). Ela indica quanto você vai receber de volta em caso de vitória. Exemplo: se apostar R$ 10,00 na Odd 2.00, você recebe R$ 20,00 de retorno total (R$ 10,00 de lucro).',
  probability: 'Sua Probabilidade: A chance real (de 1% a 99%) que você calcula que o evento tem de acontecer. Se a sua estimativa de chance for maior que a calculada pela casa de apostas, a aposta tem "Valor Esperado Positivo (+EV)".',
  fraction: 'Fração de Kelly: Uma regra matemática de segurança para não apostar muito dinheiro. Em vez de investir o valor total que a matemática pura sugere (Full Kelly), você aposta apenas 1/4 (25%) ou 1/2 (50%) desse valor. Isso reduz drasticamente as chances de quebrar a banca numa sequência ruim.',
  'xg-home': 'xG Mandante: Expected Goals (Gols Esperados) do time da casa nos últimos jogos. Indica a quantidade e a qualidade das chances de finalização que a equipe criou. Quanto maior o xG, mais perigoso é o ataque do time.',
  'xga-home': 'xGA Mandante: Expected Goals Against (Gols Contra Esperados) do time da casa. Avalia o desempenho defensivo: indica a qualidade das chances que a defesa concede aos adversários. Quanto menor o xGA, mais forte é a defesa.',
  'xg-away': 'xG Visitante: Expected Goals (Gols Esperados) do time de fora. Revela a produtividade ofensiva e a perigosidade de suas finalizações quando joga longe dos seus domínios.',
  'xga-away': 'xGA Visitante: Expected Goals Against (Gols Contra Esperados) do time de fora. Mede a vulnerabilidade defensiva da equipe quando joga como visitante.'
};

/**
 * Ativa e gerencia o clique nos botões de ajuda (?)
 */
function setupHelpTooltips() {
  const tooltip = DOM.helpTooltip;
  if (!tooltip) return;

  const triggers = document.querySelectorAll('.help-trigger');

  triggers.forEach((trigger) => {
    trigger.addEventListener('click', (event) => {
      event.stopPropagation(); // Evita propagação ao document para não fechar imediatamente

      const helpId = trigger.getAttribute('data-help');
      const text = HELP_TEXTS[helpId] || 'Explicação não disponível.';

      // Proteção de segurança contra XSS: usar .textContent para injetar o texto puro!
      tooltip.textContent = text;
      tooltip.style.display = 'block';

      // Posicionamento dinâmico
      const rect = trigger.getBoundingClientRect();

      // Ajuste de posição absoluto considerando o scroll atual da página
      tooltip.style.left = `${rect.left + window.scrollX - 100}px`;

      // Exibe primeiro para podermos calcular a altura renderizada
      const tooltipHeight = tooltip.offsetHeight;
      const topPos = rect.top + window.scrollY - tooltipHeight - 10;

      tooltip.style.top = `${topPos}px`;
      tooltip.setAttribute('aria-hidden', 'false');

      addLog(`Explicação visual aberta para a métrica: [${helpId}]`, 'info');
    });
  });

  // Fecha o tooltip ao clicar em qualquer lugar fora dele
  document.addEventListener('click', (event) => {
    if (tooltip.style.display === 'block') {
      const isClickInside = tooltip.contains(event.target);
      if (!isClickInside) {
        closeTooltip();
      }
    }
  });

  // Acessibilidade: fechar ao apertar ESC
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && tooltip.style.display === 'block') {
      closeTooltip();
    }
  });

  function closeTooltip() {
    tooltip.style.display = 'none';
    tooltip.setAttribute('aria-hidden', 'true');
  }
}

/**
 * Limpa todos os campos da calculadora de gestão de banca e reseta resultados
 */
function clearFinanceFields() {
  if (DOM.inputBank) DOM.inputBank.value = '';
  if (DOM.inputOdds) DOM.inputOdds.value = '';
  if (DOM.inputProbability) DOM.inputProbability.value = '';
  
  // Reseta fração de Kelly para recomendada (1/4 Kelly)
  const radioQuarter = document.getElementById('radio-quarter');
  if (radioQuarter) radioQuarter.checked = true;

  // Reseta os elementos visuais de resultado
  if (DOM.resultStakePercent) DOM.resultStakePercent.textContent = '0.00%';
  if (DOM.resultStakeValue) DOM.resultStakeValue.textContent = 'R$ 0,00';
  if (DOM.resultEvaluation) {
    DOM.resultEvaluation.textContent = 'Aguardando dados...';
    DOM.resultEvaluation.className = 'tile-value';
  }
  if (DOM.riskBar) DOM.riskBar.style.width = '0%';

  addLog('Painel de gestão de banca e risco redefinido.', 'info');
}

/**
 * Limpa todos os campos do estimador de True Odds e oculta o resultado de Poisson
 */
// Cache global cliente das estatísticas das equipes obtidas do backend
let cacheTeams = [];

function clearPricingFields() {
  if (DOM.inputXgHome) DOM.inputXgHome.value = '';
  if (DOM.inputXgaHome) DOM.inputXgaHome.value = '';
  if (DOM.inputXgAway) DOM.inputXgAway.value = '';
  if (DOM.inputXgaAway) DOM.inputXgaAway.value = '';

  // Reseta dropdown de liga e desabilita dropdowns de times
  if (DOM.selectLeague) {
    DOM.selectLeague.value = '';
    filterTeamsByLeague();
  }

  // Oculta a área de resultados de precificação
  if (DOM.pricingResults) DOM.pricingResults.style.display = 'none';

  addLog('Campos do estimador de True Odds redefinidos.', 'info');
}

/**
 * Consome a rota do backend para obter dados consolidados das equipes
 */
async function loadTeamsData() {
  try {
    const response = await fetch('/api/v1/teams');
    if (!response.ok) {
      addLog('Erro ao obter banco de dados de times do servidor.', 'warning');
      return;
    }

    const resData = await response.json();
    if (resData.success && Array.isArray(resData.data)) {
      cacheTeams = resData.data;
      addLog(`Carregados ${cacheTeams.length} times das principais ligas do Express.`, 'success');
    }
  } catch (error) {
    addLog('Falha ao conectar com o serviço de estatísticas de equipes. Modo autônomo ativo.', 'warning');
  }
}

/**
 * Filtra os times de acordo com a liga selecionada
 */
function filterTeamsByLeague() {
  if (!DOM.selectLeague || !DOM.selectHomeTeam || !DOM.selectAwayTeam) return;

  const leagueVal = DOM.selectLeague.value;

  if (!leagueVal) {
    // Se não há liga, desabilita seletores de times e volta estado inicial
    DOM.selectHomeTeam.disabled = true;
    DOM.selectAwayTeam.disabled = true;
    DOM.selectHomeTeam.innerHTML = '<option value="">-- Selecione a Liga Primeiro --</option>';
    DOM.selectAwayTeam.innerHTML = '<option value="">-- Selecione a Liga Primeiro --</option>';
    return;
  }

  // Filtra times pertencentes à liga selecionada
  let filtered = [];
  if (leagueVal === 'brasileirao') {
    filtered = cacheTeams.filter((t) => 
      t.league.includes('Brasileirão') || 
      t.league.includes('Lib') || 
      t.league.includes('Sudamericana')
    );
  } else if (leagueVal === 'premier') {
    filtered = cacheTeams.filter((t) => t.league.includes('Premier League'));
  } else if (leagueVal === 'laliga') {
    filtered = cacheTeams.filter((t) => t.league.includes('La Liga'));
  } else if (leagueVal === 'bundesliga') {
    filtered = cacheTeams.filter((t) => t.league.includes('Bundesliga'));
  } else if (leagueVal === 'seriea') {
    filtered = cacheTeams.filter((t) => t.league.includes('Serie A'));
  } else if (leagueVal === 'europe') {
    // Demais ligas continentais como francesa (Ligue 1) e portuguesa (Primeira Liga)
    filtered = cacheTeams.filter((t) => 
      t.league.includes('Ligue 1') || 
      t.league.includes('Primeira Liga')
    );
  }

  // Habilita os dropdowns
  DOM.selectHomeTeam.disabled = false;
  DOM.selectAwayTeam.disabled = false;

  // Popula com os times correspondentes ordenados alfabeticamente
  DOM.selectHomeTeam.innerHTML = '<option value="">-- Selecione o Mandante --</option>';
  DOM.selectAwayTeam.innerHTML = '<option value="">-- Selecione o Visitante --</option>';

  const sortedTeams = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
  
  sortedTeams.forEach((team) => {
    const optHome = document.createElement('option');
    optHome.value = team.id;
    optHome.textContent = team.name;

    const optAway = document.createElement('option');
    optAway.value = team.id;
    optAway.textContent = team.name;

    DOM.selectHomeTeam.appendChild(optHome);
    DOM.selectAwayTeam.appendChild(optAway);
  });

  addLog(`Filtro aplicado: ${filtered.length} equipes listadas para a competição selecionada.`, 'info');
}

/**
 * Carrega estatísticas de xG/xGA nos inputs baseado nas seleções atuais
 */
function loadSelectedTeamStats() {
  if (!DOM.selectHomeTeam || !DOM.selectAwayTeam) return;

  const homeId = DOM.selectHomeTeam.value;
  const awayId = DOM.selectAwayTeam.value;

  if (!homeId || !awayId) {
    addLog('Selecione ambos os times (Mandante e Visitante) para carregar as estatísticas.', 'warning');
    return;
  }

  if (homeId === awayId) {
    addLog('Atenção: O time Mandante e Visitante são idênticos. Selecione equipes distintas.', 'warning');
    return;
  }

  const homeTeam = cacheTeams.find((t) => t.id === homeId);
  const awayTeam = cacheTeams.find((t) => t.id === awayId);

  if (!homeTeam || !awayTeam) {
    addLog('Não foi possível recuperar os coeficientes das equipes selecionadas.', 'error');
    return;
  }

  // Carrega dados de ataque e defesa reais correspondentes ao mando de campo
  if (DOM.inputXgHome) DOM.inputXgHome.value = homeTeam.xgHome.toFixed(2);
  if (DOM.inputXgaHome) DOM.inputXgaHome.value = homeTeam.xgaHome.toFixed(2);
  if (DOM.inputXgAway) DOM.inputXgAway.value = awayTeam.xgAway.toFixed(2);
  if (DOM.inputXgaAway) DOM.inputXgaAway.value = awayTeam.xgaAway.toFixed(2);

  addLog(`Estatísticas do Understat/FBref para [${homeTeam.name}] (C) e [${awayTeam.name}] (F) carregadas nos campos.`, 'success');
}
