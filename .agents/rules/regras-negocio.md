---
trigger: always_on
---

# Regras de Negócio e Lógica Analítica - GGreen

Este documento define as diretrizes funcionais e as regras de negócio centrais do **GGreen**. O objetivo principal da aplicação é **proteger o capital do usuário e quantificar o risco matemático de cada aposta esportiva**, convertendo dados brutos em decisões lógicas de investimento (Apostas de Valor Esperado Positivo - +EV).

---

## 1. Gestão de Banca e Alocação de Risco (Core Rule)
A preservação da banca é a prioridade número um do GGreen. Toda vez que o usuário solicitar uma análise ou simular uma aposta, a aplicação **deve** intervir com diretrizes de gestão.

* **Critério de Kelly (Fracionado):** O algoritmo deve utilizar a fórmula do Critério de Kelly para calcular a porcentagem ideal da banca a ser apostada.
    * *Regra de Ouro:* Como o Kelly tradicional é muito agressivo, o GGreen deve aplicar o **Kelly Fracionado** (ex: 1/4 ou 1/2 de Kelly) como padrão de segurança.
* **Termômetro de Risco Financeiro:** A aplicação deve categorizar o valor da aposta (Stake) informada pelo usuário em três níveis visuais:
    * 🟢 **Baixo/Seguro:** Stake confortável (ex: 0.5% a 1.5% da banca).
    * 🟡 **Correto (Ajustado ao Kelly):** O valor matemático ideal para maximizar lucros sem risco de quebra (ex: 2% a 3%).
    * 🔴 **Alto Demais:** Qualquer aposta que ultrapasse 5% da banca deve gerar um alerta imediato, informando que a aposta foge dos padrões de *traders* esportivos profissionais e apresenta alto risco de ruína.

## 2. Fontes de Dados e Integrações (Scraping/API)
Para garantir que o GGreen não baseie suas decisões em "achismos", a aplicação deve cruzar dados **somente dos maiores e mais confiáveis portais de estatísticas avançadas do mundo**. A arquitetura deve prever a busca/integração com:

* **FootyStats / SoccerStats:** Essenciais para dados voltados diretamente a mercados de apostas (Over/Under gols, Porcentagem de BTTS - Ambas Marcam, médias de escanteios, cartões e estatísticas por faixa de tempo).
* **Understat / FBref:** Fontes oficiais para métricas avançadas de desempenho, obrigatoriamente utilizando a métrica **xG (Expected Goals - Gols Esperados)** e **xA (Expected Assists)** para entender a criação real de chances de um time, independentemente de fatores de sorte no placar.
* **Flashscore / SofaScore:** Cruciais para a captura de estatísticas em tempo real, *Momentum* (Pressão no jogo ao vivo), histórico de confrontos diretos (H2H) e desfalques de última hora.
* **Contingência de Captura:** O desenvolvedor terá que usar o puppeteer-extra-plugin-stealth para mascarar a automação, ou até mesmo considerar APIs de terceiros (Scraping APIs focadas em esportes) se o bloqueio for muito severo.

## 3. Motor de Probabilidade e Cruzamento de Dados
O GGreen não entrega apenas um "palpite". Ele deve operar como um oráculo de precificação.

* **Cálculo da Odd Justa (True Odds):** O algoritmo deve processar as estatísticas (xG histórico, posse em zonas de perigo, força do mando de campo, desfalques) e gerar a probabilidade real de um evento ocorrer (ex: 60% de chance do Time A vencer).
* **Identificação de Valor Esperado (+EV):** A aplicação deve comparar a Odd Justa calculada com a odd oferecida pela casa de apostas.
    * *Exemplo:* Se o GGreen calcula que o Time A tem 60% de chance de vencer (Odd Justa = 1.66), mas a casa de apostas está pagando 2.00, o sistema deve classificar a aposta como **Aposta de Valor (+EV)** e aprovar a entrada. Se a casa estiver pagando 1.50, a aposta deve ser rejeitada ou marcada como "Baixo Valor".
* **Performance em Tempo Real:** Se o GGreen for operar com jogos ao vivo (em tempo real), talvez a simulação de Monte Carlo precise ser migrada mais cedo para bibliotecas C++ embutidas ou para o microserviço Python, deixando o Node.js apenas com a gestão das requisições e a matemática mais leve (Fase 1 - Poisson).

## 4. Transparência de Análise (Insights Explicáveis)
O usuário precisa confiar na inteligência da ferramenta e aprender com ela.
* Toda recomendação ou análise de risco gerada pelo GGreen deve vir acompanhada de um pequeno resumo explicativo (ex: *"A aposta apresenta alto risco porque, embora o Time A seja favorito, seu xG (Gols Esperados) nos últimos 5 jogos caiu 30% e o artilheiro principal está suspenso."*).

## 5. Escopo de Desenvolvimento Inicial
* **Futebol Primeiro:** O MVP (Produto Mínimo Viável) e a primeira versão do algoritmo serão construídos **exclusivamente para Futebol**.
* **Arquitetura Extensível:** Embora inicializado em futebol, os *Controllers*, os esquemas de banco de dados e os módulos de cálculo do Node.js devem ser construídos com arquitetura modular (ex: `Interface SportsAnalytics`). Isso garantirá que a adição futura de novas modalidades (Basquete, Tênis, E-Sports) exija apenas a plugar novos módulos de regras, sem refatorar o núcleo financeiro da aplicação.