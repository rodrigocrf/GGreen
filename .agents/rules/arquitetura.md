---
trigger: always_on
---

# Diretrizes de Arquitetura, Engenharia e Motor Algorítmico - GGreen

Este documento estabelece as especificações técnicas, os padrões de projeto estruturais e o funcionamento do motor probabilístico do GGreen. O foco desta arquitetura é garantir alto desempenho no processamento numérico, escalabilidade para novas modalidades esportivas e total resiliência no processamento assíncrono de dados.

---

## 1. Padrão Arquitetural: Service-Oriented MVC

A aplicação adota uma variação do padrão Model-View-Controller (MVC), introduzindo uma camada de Serviços e Repositórios dedicada para garantir que os controladores permaneçam leves (*Thin Controllers*) e isolados das complexidades matemáticas.

Para facilitar a compreensão do fluxo de dados por qualquer desenvolvedor no projeto, a arquitetura está dividida nas seguintes camadas de responsabilidade (Top-Down):

### 🌐 1. Controllers (Interface de Entrada / API)
* **Stack Tecnológica:** Node.js / Express / Zod (ou Joi)
* **Responsabilidade:** Atuam como os "porteiros" da aplicação. Eles recebem as requisições HTTP (REST), realizam a sanitização e validação estrutural do *payload* de entrada (Body, Params, Query), repassam os dados validados para o Serviço correspondente e formatam a resposta JSON final para o cliente. **Regra de ouro: Nenhuma lógica de negócio deve habitar os Controllers.**

### 🧠 2. Services (O Cérebro da Aplicação)
* **Stack Tecnológica:** TypeScript (Orientado a Domínio)
* **Responsabilidade:** É onde a mágica matemática acontece. Esta camada orquestra as regras centrais: execução do Critério de Kelly Fracionado, processamento e cruzamento de estatísticas brutas para determinar a Odd Justa (True Odds) e validação de risco das apostas sugeridas.

### ⚙️ 3. Scrapers & Workers (Processamento Assíncrono)
* **Stack Tecnológica:** Puppeteer / Cheerio / BullMQ (Filas) / Redis
* **Responsabilidade:** Agentes de execução autônoma que rodam em background. São acionados para buscar dados ou odds em portais de terceiros. Seu isolamento é vital para garantir que atrasos na rede externa não bloqueiem a thread principal do servidor Node.js (Event Loop).
* **Solução Anti-Bot:** O desenvolvedor terá que usar o puppeteer-extra-plugin-stealth para mascarar a automação, ou até mesmo considerar APIs de terceiros (Scraping APIs focadas em esportes) se o bloqueio for muito severo.

### 🤖 4. Data Predictor (Microserviço Preditivo Avançado)
* **Stack Tecnológica:** Python / XGBoost / Bibliotecas de ML
* **Responsabilidade:** Módulo de expansão futura, executado como um microserviço isolado. Focado em absorver alta dimensionalidade de dados (histórico de anos, clima, lesões) processados via Inteligência Artificial, retroalimentando a camada de Services do Node.js via API interna.
* **Segurança de Rede:** É preciso garantir que o microserviço Python não seja exposto à internet pública. Ele deve rodar em uma rede interna virtual (VPC) fechada, onde apenas o servidor Node.js tenha permissão de fazer requisições para ele.

A separação rígida garante que falhas nas rotinas de Web Scraping fiquem contidas dentro de seus respectivos Workers, utilizando blocos de tratamento isolados (`try/catch`) para prevenir exceções fatais (`uncaughtException`) que poderiam derrubar o servidor Node.js.

---

## 2. O Motor Algorítmico Probabilístico

O GGreen opera em três camadas evolucionárias de inteligência estatística para definir a Odd Justa (*True Odds*) e encontrar apostas com Valor Esperado Positivo (+EV).

### Fase 1: Distribuição de Poisson Ajustada por xG (Core MVP)
Para modelar a probabilidade de placares em partidas de futebol, utiliza-se a Distribuição de Poisson, calculada de forma independente para cada equipe:

`P(k; λ) = (λ^k * e^-λ) / k!`

O diferencial analítico do GGreen reside no cálculo do parâmetro λ (frequência esperada de eventos). Em vez de utilizar médias simples de gols marcados ou sofridos, o algoritmo alimenta-se obrigatoriamente de métricas avançadas de portais consolidados (FootyStats, FBref, Understat):
* **Expected Goals (xG):** Qualidade real das chances criadas, mitigando distorções causadas por sorte ou lances isolados.
* **Expected Goals Against (xGA):** Desempenho defensivo real sob pressão de finalizações.

### Fase 2: Simulação de Monte Carlo
Após estabelecer as forças de ataque e defesa baseadas em xG, a camada de serviço projeta cenários executando 10.000 simulações rápidas da mesma partida em background. A frequência acumulada dos resultados determina com precisão cirúrgica as probabilidades reais de mercados secundários complexos, como Over/Under de gols e Ambas Marcam (BTTS).
* **Otimização de Performance:** Se o GGreen for operar com jogos ao vivo (em tempo real), talvez a simulação de Monte Carlo precise ser migrada mais cedo para bibliotecas C++ embutidas ou para o microserviço Python, deixando o Node.js apenas com a gestão das requisições e a matemática mais leve (Fase 1 - Poisson).

### Fase 3: Microserviço de Machine Learning (Evolução)
Variáveis de alta dimensionalidade (como histórico de confrontos diretos do Flashscore/SofaScore, condições climáticas e desgaste físico de jogadores) serão processadas por modelos baseados em árvores de decisão (XGBoost). Devido à natureza de thread única do Node.js, este módulo rodará como um microserviço em Python, sendo consultado via requisições RESTful de forma assíncrona.

---

## 3. Processamento Assíncrono com Redis e BullMQ

Para manter o GGreen responsivo, toda tarefa de longa duração é delegada para uma arquitetura baseada em mensageria e filas locais:
1.  O usuário ou o sistema solicita a atualização de cotações através de um endpoint REST (`POST /api/v1/analysis`).
2.  O controlador insere a tarefa em uma fila gerenciada pelo **BullMQ** e mantida em memória pelo **Redis**, respondendo imediatamente ao cliente com o status de processamento aceito.
3.  Os Workers em background executam o scraping ou simulação e, ao finalizarem, utilizam WebSockets para notificar o front-end em tempo real.

---

## 4. Padrões de Projeto para Extensibilidade (SOLID)

Embora a aplicação seja inicialmente focada em futebol, ela deve estar pronta para a introdução de novos esportes. Para isso, utiliza-se rigorosamente o **Strategy Pattern** na camada de serviços:

```typescript
interface ISportsPricer {
  calculateTrueOdds(matchId: string): Promise<MarketProbabilities>;
}

class FootballPricer implements ISportsPricer {
  // Implementação baseada em Poisson e xG
}

class BasketballPricer implements ISportsPricer {
  // Implementação futura baseada em histórico de posses e eficiência
}