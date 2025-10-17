# Escape Zone

Este é um projeto de jogo de corrida de sobrevivência móvel desenvolvido com [Expo](https://expo.dev) e [React Native](https://reactnative.dev/). O jogo, chamado "Escape Zone", utiliza o acelerômetro do dispositivo para controlar um carro que deve desviar de obstáculos e usar turbos para sobreviver o maior tempo possível.

## 🎮 Gameplay

O objetivo do jogo é sobreviver o máximo possível numa corrida frenética. Incline o seu dispositivo para os lados para desviar. Cuidado com os obstáculos na pista! Apanhe os turbos para ganhar um impulso de velocidade. O jogo termina quando o jogador colide com um cone.

## 🖼️ Telas do Jogo

O jogo é composto por três telas principais:

* **Tela Inicial (`StartScreen.tsx`):** Apresenta o título do jogo, uma imagem do carro e as instruções básicas. Um botão "Iniciar Corrida" dá início à partida.
* **Tela de Jogo (`EscapeZone.tsx`):** É a tela principal onde a corrida de sobrevivência acontece. O jogador controla o carro, desvia de obstáculos e pode usar turbos. A pontuação é exibida na parte superior da tela.
* **Tela de Fim de Jogo (`GameOverScreen.tsx`):** Exibida quando o jogo termina, mostrando a pontuação final do jogador e um botão para "Jogar Novamente".

## ⚙️ Componentes Principais

O projeto é modular e organizado em vários componentes:

* **`EscapeZone.tsx`**: O coração do jogo, onde toda a lógica principal reside.
    * **Estado do Jogo:** Gere o estado atual do jogo, como a posição do carro, pontuação, velocidade e a posição dos obstáculos e power-ups (turbo).
    * **Controles:** Utiliza a API `Accelerometer` do Expo para capturar os dados do acelerômetro do dispositivo e traduzi-los em movimento para o carro.
    * **Loop do Jogo:** Um loop de jogo é executado em intervalos regulares para atualizar a posição dos itens na tela, gerando um efeito de rolagem contínua da estrada.
    * **Deteção de Colisão:** Verifica continuamente se o carro colidiu com um obstáculo ou coletou turbos.
    * **Áudio:** Reproduz efeitos sonoros para colisões e ativação do turbo, utilizando la API `expo-av`.

## 🛠️ Tecnologias Utilizadas

* **[Expo](https://expo.dev)**: Plataforma para construir aplicações universais com React.
* **[React Native](https://reactnative.dev)**: Framework para construir aplicações móveis nativas usando React.
* **[Expo Sensors](https://docs.expo.dev/versions/latest/sdk/sensors/)**: API do Expo para aceder a sensores do dispositivo, como o acelerómetro.
* **[Expo AV](https://docs.expo.dev/versions/latest/sdk/av/)**: API do Expo para reprodução de áudio e vídeo.

## 🚀 Como Começar

Siga os passos abaixo para executar o projeto no seu ambiente de desenvolvimento.

### Pré-requisitos

* Node.js e npm instalados.
* Um emulador Android/iOS ou um dispositivo físico com a aplicação Expo Go instalada.

### Instalação

1.  Clone o repositório para a sua máquina local.
2.  Navegue até ao diretório do projeto e instale as dependências:

    ```bash
    npm install
    ```

### Executando o Projeto

Após a instalação das dependências, inicie o servidor de desenvolvimento do Expo:

```bash
npx expo start
```
Isso abrirá o Expo Dev Tools no seu navegador. Pode então escolher executar a aplicação num emulador ou no seu dispositivo físico, digitalizando o código QR com a aplicação Expo Go.

# 🌟 Aproveite o Jogo!
Acelere, desvie dos cones e sobreviva o máximo que puder! 🏎️💨