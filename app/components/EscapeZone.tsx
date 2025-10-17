// Importações necessárias do React, React Native e Expo
import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Dimensions, Text, Image } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import { Audio } from 'expo-av';

// Importação das telas de início e fim de jogo
import StartScreen from './StartScreen';
import GameOverScreen from './GameOverScreen';

// Pega as dimensões da tela do dispositivo
const { width, height } = Dimensions.get('window');

// --- CONSTANTES DO JOGO ---
const CAR_SIZE = 70;
const OBSTACLE_SIZE = 50;
const TURBO_SIZE = 40;
const TREE_SIZE = 80;
const INITIAL_SPEED = 4;
const MAX_SPEED = 12;
const ROAD_SEGMENT_HEIGHT = 20;

// --- DEFINIÇÃO DE TIPOS (TYPESCRIPT) ---
type RoadSegment = {
  id: number;
  y: number;
  x: number;
  width: number;
};

type SceneryObject = {
    id: number;
    y: number;
    x: number;
    size: number;
};

// **NOVO TIPO:** Para objetos genéricos do jogo, melhorando a tipagem
type GameObject = {
  id: number;
  x: number;
  y: number;
};

// --- COMPONENTE PRINCIPAL DO JOGO --- 
export default function EscapeZone() {
  // Dados do acelerômetro
  const [accelerometerData, setAccelerometerData] = useState({ x: 0, y: 0, z: 0 });
  // Posição do carro
  const [carPosition, setCarPosition] = useState({ x: width / 2 - CAR_SIZE / 2, y: height - CAR_SIZE * 2 });
  // Rotação do carro
  const [carRotation, setCarRotation] = useState(0);
  // Obstáculos na tela (com tipagem corrigida)
  const [obstacles, setObstacles] = useState<GameObject[]>([]);
  // Turbos na tela (com tipagem corrigida)
  const [powerUps, setPowerUps] = useState<GameObject[]>([]);
  // Segmentos da pista
  const [roadSegments, setRoadSegments] = useState<RoadSegment[]>([]);
  // Árvores
  const [scenery, setScenery] = useState<SceneryObject[]>([]);
  // Direção e duração da curva atual da pista
  const [curve, setCurve] = useState({ direction: 0, duration: 0 });
  // Pontuação do jogador
  const [score, setScore] = useState(0);
  // Velocidade atual
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  // Impulso de velocidade ao usar o turbo
  const [turboBoost, setTurboBoost] = useState(0);
  // Estado atual: 'start', 'playing', ou 'gameOver'
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameOver'>('start');


  // --- REFERÊNCIAS PARA ÁUDIO ---
  const crashSound = useRef<Audio.Sound | null>(null);
  const turboSound = useRef<Audio.Sound | null>(null);

  // **NOVO REF:** Usado para acessar o estado atualizado dentro do loop do jogo sem recriá-lo.
  const gameLoopStateRef = useRef({ roadSegments, curve, score });

  useEffect(() => {
    // Atualiza o ref a cada renderização para que o loop sempre tenha os dados mais recentes.
    gameLoopStateRef.current = { roadSegments, curve, score };
  });

  // Função assíncrona para carregar os arquivos de áudio
  async function setupAudio() {
    try {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const { sound: crash } = await Audio.Sound.createAsync(require('../../assets/sounds/explosion.mp3'));
      crashSound.current = crash;
      const { sound: turbo } = await Audio.Sound.createAsync(require('../../assets/sounds/turbo.mp3'));
      turboSound.current = turbo;
    } catch (error) {
      console.error("Não foi possível carregar o som", error);
    }
  }

  // --- EFEITOS (useEffect) ---

  // Roda apenas uma vez para configurar os áudios.
  useEffect(() => {
    setupAudio();
    return () => {
      crashSound.current?.unloadAsync();
      turboSound.current?.unloadAsync();
    };
  }, []); 


  // Função para iniciar/reiniciar o jogo
  const handleStartGame = () => {
    setScore(0);
    setSpeed(INITIAL_SPEED);
    setTurboBoost(0);
    setCarPosition({ x: width / 2 - CAR_SIZE / 2, y: height - CAR_SIZE * 2 });
    setCarRotation(0);
    setObstacles([]);
    setPowerUps([]);
    setScenery([]);
  
    const initialSegments = Array.from({ length: Math.ceil(height / ROAD_SEGMENT_HEIGHT) + 5 }).map((_, i) => ({
        id: i,
        y: height - (i * ROAD_SEGMENT_HEIGHT),
        x: width * 0.2,
        width: width * 0.6,
      }));
    setRoadSegments(initialSegments);
    setGameState('playing'); 
  };

  // useEffect para o acelerômetro
  useEffect(() => {
    if (gameState !== 'playing') {
      Accelerometer.removeAllListeners();
      return;
    }
    Accelerometer.setUpdateInterval(16); 
    const subscription = Accelerometer.addListener(setAccelerometerData); 
    return () => subscription.remove(); 
  }, [gameState]); // **CORRIGIDO:** Removida a dependência desnecessária 'turboBoost'

  // useEffect para controlar o carro
  useEffect(() => {
    if (gameState !== 'playing') return; 
    const steerSensitivity = 0.4; 
    const maxAngle = 45; 
    let rotationChange = accelerometerData.y * steerSensitivity * 10;
    let newRotation = carRotation + rotationChange;
    newRotation = Math.max(-maxAngle, Math.min(maxAngle, newRotation));
    setCarRotation(newRotation);
    const angleInRadians = newRotation * (Math.PI / 180);
    let newX = carPosition.x + speed * Math.sin(angleInRadians);
    
    // Verifica se o carro está dentro da pista
    const carSegment = roadSegments.find(s => carPosition.y >= s.y && carPosition.y < s.y + ROAD_SEGMENT_HEIGHT);
    if (carSegment) {
        if (newX < carSegment.x) {
            newX = carSegment.x;
        }
        if (newX > carSegment.x + carSegment.width - CAR_SIZE) {
            newX = carSegment.x + carSegment.width - CAR_SIZE;
        }
    } else if(roadSegments.length > 0) { // Se não encontrar um segmento, o carro saiu da pista
        crashSound.current?.replayAsync();
        setGameState('gameOver');
    }
    setCarPosition({ ...carPosition, x: newX }); 
  }, [accelerometerData, gameState, speed, roadSegments]); 

  // useEffect para aumentar a velocidade com o tempo
  useEffect(() => {
    if (gameState === 'playing' && score > 0 && score % 200 === 0 && score > 1) {
      setSpeed(prevSpeed => Math.min(prevSpeed + 0.2, MAX_SPEED));
    }
  }, [score, gameState]); 

  // --- O LOOP PRINCIPAL DO JOGO (TOTALMENTE REFEITO) ---
  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameLoop = setInterval(() => {
      const effectiveSpeed = speed + turboBoost;
      
      // 1. AUMENTA A PONTUAÇÃO (usando a forma de callback para segurança)
      setScore(prev => prev + 1);

      // 2. MOVE TODOS OS OBJETOS PARA BAIXO
      setObstacles(prev => prev.map(o => ({ ...o, y: o.y + effectiveSpeed })).filter(o => o.y < height + OBSTACLE_SIZE));
      setPowerUps(prev => prev.map(p => ({ ...p, y: p.y + effectiveSpeed })).filter(p => p.y < height + TURBO_SIZE));
      setScenery(prev => prev.map(s => ({ ...s, y: s.y + effectiveSpeed })).filter(s => s.y < height + TREE_SIZE));

      // 3. ATUALIZA E GERA A PISTA
      // Lê o estado atual do ref para evitar dependências no useEffect
      const { roadSegments: currentRoadSegments, curve: currentCurve, score: currentScore } = gameLoopStateRef.current;

      const movedSegments = currentRoadSegments
        .map(segment => ({ ...segment, y: segment.y + effectiveSpeed }))
        .filter(segment => segment.y < height + ROAD_SEGMENT_HEIGHT);
      
      const lastSegment = movedSegments[movedSegments.length - 1];
      let newSegments = [...movedSegments];

      if (lastSegment && lastSegment.y > -ROAD_SEGMENT_HEIGHT * 5) {
          const difficulty = Math.min(currentScore / 15000, 1);
          
          // Lógica para criar curvas na pista
          let updatedCurve = { ...currentCurve };
          if(currentCurve.duration <= 0) {
              const newDirection = Math.random() > 0.4 ? (Math.random() > 0.5 ? 1 : -1) : 0; 
              updatedCurve = {
                  direction: newDirection,
                  duration: Math.floor(Math.random() * 100 + 80)
              };
              setCurve(updatedCurve);
          } else {
              setCurve(c => ({...c, duration: c.duration - 1}));
          }

          const newWidth = width * (0.6 - (0.35 * difficulty)); 
          const curveStrength = updatedCurve.direction * (1 + 3 * difficulty);
          let newX = lastSegment.x + curveStrength;
          if (newX < 0) newX = 0;
          if (newX + newWidth > width) newX = width - newWidth;

          const newSegment: RoadSegment = {
              id: Math.random(),
              y: lastSegment.y - ROAD_SEGMENT_HEIGHT,
              x: newX,
              width: newWidth,
          };
          newSegments.push(newSegment);

          // 4. GERA CENÁRIO (ÁRVORES)
          if (Math.random() < 0.15) { 
              const side = Math.random() > 0.5 ? 1 : -1; 
              const treeX = side > 0 ? newSegment.x + newSegment.width + Math.random() * 80 : newSegment.x - 60 - Math.random() * 80;
              setScenery(prevScenery => [...prevScenery, {id: Math.random(), x: treeX, y: newSegment.y, size: Math.random() * 50 + 40}]);
          }
      }
      setRoadSegments(newSegments);

      // 5. GERA OBSTÁCULOS E TURBOS
      const currentSegmentForSpawning = newSegments.find(s => s.y > -ROAD_SEGMENT_HEIGHT && s.y < 0);
      if (currentSegmentForSpawning) {
        if (Math.random() < 0.03) { 
          const spawnX = currentSegmentForSpawning.x + Math.random() * (currentSegmentForSpawning.width - OBSTACLE_SIZE);
          setObstacles(prev => [...prev, { id: Math.random(), x: spawnX, y: -OBSTACLE_SIZE }]);
        }
        if (Math.random() < 0.008) { 
          const spawnX = currentSegmentForSpawning.x + Math.random() * (currentSegmentForSpawning.width - TURBO_SIZE);
          setPowerUps(prev => [...prev, { id: Math.random(), x: spawnX, y: -TURBO_SIZE }]);
        }
      }
    }, 16); 

    return () => clearInterval(gameLoop); 
  }, [gameState, speed, turboBoost]); // Dependências mínimas necessárias para o cálculo de `effectiveSpeed`


  // useEffect para DETECÇÃO DE COLISÃO
  useEffect(() => {
    if (gameState !== 'playing') return;

    const carCenterX = carPosition.x + CAR_SIZE / 2;
    const carCenterY = carPosition.y + CAR_SIZE / 2;
    const carRadius = CAR_SIZE * 0.35; 

    // Colisão com Obstáculos
    obstacles.forEach(obstacle => {
        const obstacleCenterX = obstacle.x + OBSTACLE_SIZE / 2;
        const obstacleCenterY = obstacle.y + OBSTACLE_SIZE / 2;
        const obstacleRadius = OBSTACLE_SIZE * 0.4;
        const dx = carCenterX - obstacleCenterX;
        const dy = carCenterY - obstacleCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < carRadius + obstacleRadius) {
            crashSound.current?.replayAsync();
            setGameState('gameOver');
        }
    });

    // Colisão com Power-ups
    powerUps.forEach(powerUp => {
        const powerUpCenterX = powerUp.x + TURBO_SIZE / 2;
        const powerUpCenterY = powerUp.y + TURBO_SIZE / 2;
        const powerUpRadius = TURBO_SIZE / 2;
        const dx = carCenterX - powerUpCenterX;
        const dy = carCenterY - powerUpCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < carRadius + powerUpRadius) {
            setPowerUps(prev => prev.filter(p => p.id !== powerUp.id)); // **CORRIGIDO:** Removido '/'
            setTurboBoost(8); 
            turboSound.current?.replayAsync(); 
            setTimeout(() => setTurboBoost(0), 2000); 
        }
    });
  }, [carPosition, obstacles, powerUps, gameState]); 


  // --- RENDERIZAÇÃO ---
  if (gameState === 'start') {
    return <StartScreen onStart={handleStartGame} />;
  }

  if (gameState === 'gameOver') {
    return <GameOverScreen score={score} onRestart={handleStartGame} />;
  }

  return (
    <View style={styles.container}>
        {scenery.map(s => (
            <View key={s.id} style={[styles.tree, {left: s.x, top: s.y, width: s.size, height: s.size, borderRadius: s.size / 2}]} />
        ))}
        {roadSegments.map(segment => (
            <View
                key={segment.id}
                style={[styles.roadSegment, { top: segment.y, left: segment.x, width: segment.width }]}
            />
        ))}
        <Text style={styles.scoreText}>Pontos: {score}</Text>

        {obstacles.map(o => (
          <Image key={o.id} source={require('../../assets/images/cone.png')} style={[styles.item, { width: OBSTACLE_SIZE, height: OBSTACLE_SIZE, left: o.x, top: o.y }]} />
        ))}
        {powerUps.map(p => (
          <Image key={p.id} source={require('../../assets/images/turbo.png')} style={[styles.item, { width: TURBO_SIZE, height: TURBO_SIZE, left: p.x, top: p.y }]} />
        ))}
        <Image
          source={require('../../assets/images/car.png')}
          style={[styles.car, { left: carPosition.x, top: carPosition.y, transform: [{ rotate: `${carRotation}deg` }] }]}
        />
    </View>
  );
}

// --- ESTILOS (StyleSheet) ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#27ae60',
  },
  roadSegment: {
    position: 'absolute',
    height: ROAD_SEGMENT_HEIGHT + 2,
    backgroundColor: '#34495e',
  },
  tree: {
    position: 'absolute',
    backgroundColor: '#16a085',
    zIndex: 0,
  },
  scoreText: {
    position: 'absolute',
    top: 40,
    left: 20,
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
    zIndex: 10,
  },
  car: {
    position: 'absolute',
    width: CAR_SIZE,
    height: CAR_SIZE,
    resizeMode: 'contain',
    zIndex: 5,
  },
  item: {
    position: 'absolute',
    resizeMode: 'contain',
    zIndex: 6,
  },
});