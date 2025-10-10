# Escape Zone

Este é um projeto de jogo móvel de corrida e sobrevivência desenvolvido com [Expo](https://expo.dev) e [React Native](https://reactnative.dev/). O jogo, chamado "Escape Zone", utiliza o acelerômetro do dispositivo para controlar um carro que deve desviar de obstaculos e usar turbos para sobreviver o maior tempo possível.

## 🎮 Gameplay

O objetivo do jogo é sobreviver o máximo possível em uma corrida frenética. Incline seu dispositivo para os lados para desviar, para frente para acelerar e para trás para frear. Cuidado com os obstaculos na pista! Sacuda o celular para ativar um turbo e ganhar um impulso de velocidade. O jogo termina quando o jogador colide com um cone.

## 🖼️ Telas do Jogo

O jogo é composto por três telas principais:

* **Tela Inicial (`StartScreen.tsx`):** Apresenta o título do jogo, uma imagem do carro e as instruções básicas. Um botão "Iniciar Corrida" dá início à partida.
* **Tela de Jogo (`EscapeZone.tsx`):** É a tela principal onde a corrida de sobrevivência acontece. O jogador controla o carro, desvia de obstaculos e pode usar turbos. A pontuação (tempo sobrevivido) e o nível de turbo são exibidos na parte superior da tela.
* **Tela de Fim de Jogo (`GameOverScreen.tsx`):** Exibida quando o jogo termina, mostrando a pontuação final do jogador e um botão para "Jogar Novamente".

## ⚙️ Componentes Principais

O projeto é modular e organizado em vários componentes:

* **`EscapeZone.tsx`**: O coração do jogo, onde toda a lógica principal reside.
    * **Estado do Jogo:** Gerencia o estado atual do jogo, como a posição do carro, pontuação, velocidade e a posição dos obstáculos  power-ups (turbo).
    * **Controles:** Utiliza a API `Accelerometer` do Expo para capturar os dados do acelerômetro do dispositivo e traduzi-los em movimento para o carro (aceleração, freio e direção). Detecta um movimento de "sacudir" para ativar o turbo.
    * **Loop do Jogo:** Um loop de jogo é executado em intervalos regulares para atualizar a posição dos itens na tela, gerando um efeito de rolagem contínua da estrada.
    * **Detecção de Colisão:** Verifica continuamente se o carro colidiu com o obstaculo ou coletou turbos.
    * **Áudio:** Reproduz efeitos sonoros para o motor do carro, colisões e ativação do turbo, utilizando a API `expo-av`.

## 🛠️ Tecnologias Utilizadas

* **[Expo](https://expo.dev)**: Plataforma para construir aplicativos universais com React.
* **[React Native](https://reactnative.dev)**: Framework para construir aplicativos móveis nativos usando React.
* **[Expo Sensors](https://docs.expo.dev/versions/latest/sdk/sensors/)**: API do Expo para acessar sensores do dispositivo, como o acelerômetro.
* **[Expo AV](https://docs.expo.dev/versions/latest/sdk/av/)**: API do Expo para reprodução de áudio e vídeo.

## 🚀 Como Começar

Siga os passos abaixo para executar o projeto em seu ambiente de desenvolvimento.

### Pré-requisitos

* Node.js e npm instalados.
* Um emulador Android/iOS ou um dispositivo físico com o aplicativo Expo Go instalado.

### Instalação

1.  Clone o repositório para a sua máquina local.
2.  Navegue até o diretório do projeto e instale as dependências:

    ```bash
    npm install
    ```

### Executando o Projeto

Após a instalação das dependências, inicie o servidor de desenvolvimento do Expo:

```bash
npx expo start
```

Isso abrirá o Expo Dev Tools no seu navegador. Você pode então escolher executar o aplicativo em um emulador ou em seu dispositivo físico, escaneando o QR code com o aplicativo Expo Go.

## 🌟 Aproveite o Jogo!
Acelere, desvie dos cones e sobreviva o máximo que puder! 🏎️💨🧟