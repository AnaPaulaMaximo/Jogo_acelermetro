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

type GameObject = {
  id: number;
  x: number;
  y: number;
};

// --- COMPONENTE PRINCIPAL DO JOGO --- 
export default function EscapeZone() {
  // Estados do componente
  const [accelerometerData, setAccelerometerData] = useState({ x: 0, y: 0, z: 0 });
  const [carPosition, setCarPosition] = useState({ x: width / 2 - CAR_SIZE / 2, y: height - CAR_SIZE * 2 });
  const [carRotation, setCarRotation] = useState(0);
  const [obstacles, setObstacles] = useState<GameObject[]>([]);
  const [powerUps, setPowerUps] = useState<GameObject[]>([]);
  const [roadSegments, setRoadSegments] = useState<RoadSegment[]>([]);
  const [scenery, setScenery] = useState<SceneryObject[]>([]);
  const [curve, setCurve] = useState({ direction: 0, duration: 0 });
  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const [turboBoost, setTurboBoost] = useState(0);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameOver'>('start');

  // Referências para Áudio e Estado do Jogo
  const crashSound = useRef<Audio.Sound | null>(null);
  const turboSound = useRef<Audio.Sound | null>(null);

  const stateRef = useRef({
    roadSegments,
    curve,
    score,
    carPosition,
    carRotation,
    accelerometerData,
  });

  useEffect(() => {
    stateRef.current = {
      roadSegments,
      curve,
      score,
      carPosition,
      carRotation,
      accelerometerData,
    };
  });

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

  useEffect(() => {
    setupAudio();
    return () => {
      crashSound.current?.unloadAsync();
      turboSound.current?.unloadAsync();
    };
  }, []); 

  const handleStartGame = () => {
    setScore(0);
    setSpeed(INITIAL_SPEED);
    setTurboBoost(0);
    setCarPosition({ x: width / 2 - CAR_SIZE / 2, y: height - CAR_SIZE * 2 });
    setCarRotation(0);
    setObstacles([]);
    setPowerUps([]);
    setScenery([]);
    setCurve({ direction: 0, duration: 0 });
  
    const initialSegments = Array.from({ length: Math.ceil(height / ROAD_SEGMENT_HEIGHT) + 5 }).map((_, i) => ({
        id: Date.now() + i,
        y: height - (i * ROAD_SEGMENT_HEIGHT),
        x: width * 0.2,
        width: width * 0.6,
      }));
    setRoadSegments(initialSegments);
    setGameState('playing'); 
  };

  useEffect(() => {
    if (gameState !== 'playing') {
      Accelerometer.removeAllListeners();
      return;
    }
    Accelerometer.setUpdateInterval(16); 
    const subscription = Accelerometer.addListener(setAccelerometerData); 
    return () => subscription.remove(); 
  }, [gameState]);

  useEffect(() => {
    if (gameState === 'playing' && score > 0 && score % 200 === 0) {
      setSpeed(prevSpeed => Math.min(prevSpeed + 0.2, MAX_SPEED));
    }
  }, [score, gameState]); 

  // --- O LOOP PRINCIPAL DO JOGO (LÓGICA CENTRALIZADA) ---
  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameLoop = setInterval(() => {
      const effectiveSpeed = speed + turboBoost;
      const currentState = stateRef.current;

      // --- 1. LÓGICA DE CONTROLE DO CARRO ---
      const steerSensitivity = 0.4; 
      const maxAngle = 45; 
      let rotationChange = currentState.accelerometerData.y * steerSensitivity * 10;
      let newRotation = currentState.carRotation + rotationChange;
      newRotation = Math.max(-maxAngle, Math.min(maxAngle, newRotation));
      setCarRotation(newRotation);

      const angleInRadians = newRotation * (Math.PI / 180);
      let newX = currentState.carPosition.x + effectiveSpeed * Math.sin(angleInRadians);
      
      const carSegment = currentState.roadSegments.find(s => currentState.carPosition.y >= s.y && currentState.carPosition.y < s.y + ROAD_SEGMENT_HEIGHT);
      if (carSegment) {
          if (newX < carSegment.x) newX = carSegment.x;
          if (newX > carSegment.x + carSegment.width - CAR_SIZE) {
            newX = carSegment.x + carSegment.width - CAR_SIZE;
          }
      } else if (currentState.roadSegments.length > 0) {
          crashSound.current?.replayAsync();
          setGameState('gameOver');
          return;
      }
      setCarPosition({ ...currentState.carPosition, x: newX });

      // --- 2. ATUALIZA PONTUAÇÃO E POSIÇÃO DOS OBJETOS ---
      setScore(prev => prev + 1);
      setObstacles(prev => prev.map(o => ({ ...o, y: o.y + effectiveSpeed })).filter(o => o.y < height + OBSTACLE_SIZE));
      setPowerUps(prev => prev.map(p => ({ ...p, y: p.y + effectiveSpeed })).filter(p => p.y < height + TURBO_SIZE));
      setScenery(prev => prev.map(s => ({ ...s, y: s.y + effectiveSpeed })).filter(s => s.y < height + TREE_SIZE));

      // --- 3. ATUALIZA E GERA A PISTA ---
      setRoadSegments(prevSegments => {
        const movedSegments = prevSegments
          .map(segment => ({ ...segment, y: segment.y + effectiveSpeed }))
          .filter(segment => segment.y < height + ROAD_SEGMENT_HEIGHT);
        
        const lastSegment = movedSegments[movedSegments.length - 1];
        if (!lastSegment || lastSegment.y < -ROAD_SEGMENT_HEIGHT * 5) return movedSegments;

        const difficulty = Math.min(currentState.score / 15000, 1);
        let updatedCurve = { ...currentState.curve };

        if (currentState.curve.duration <= 0) {
            const newDirection = Math.random() > 0.4 ? (Math.random() > 0.5 ? 1 : -1) : 0; 
            updatedCurve = {
                direction: newDirection,
                duration: Math.floor(Math.random() * 100 + 80)
            };
            setCurve(updatedCurve);
        } else {
            setCurve(c => ({ ...c, duration: c.duration - 1 }));
        }

        const newWidth = width * (0.6 - (0.35 * difficulty)); 
        const curveStrength = updatedCurve.direction * (1 + 3 * difficulty);
        let newRoadX = lastSegment.x + curveStrength;
        if (newRoadX < 0) newRoadX = 0;
        if (newRoadX + newWidth > width) newRoadX = width - newWidth;

        const newSegment: RoadSegment = {
            id: Math.random(),
            y: lastSegment.y - ROAD_SEGMENT_HEIGHT,
            x: newRoadX,
            width: newWidth,
        };

        if (Math.random() < 0.15) { 
            const side = Math.random() > 0.5 ? 1 : -1; 
            const treeX = side > 0 ? newSegment.x + newSegment.width + Math.random() * 80 : newSegment.x - 60 - Math.random() * 80;
            setScenery(prev => [...prev, {id: Math.random(), x: treeX, y: newSegment.y, size: Math.random() * 50 + 40}]);
        }
        
        return [...movedSegments, newSegment];
      });

      // --- 4. GERA OBSTÁCULOS E TURBOS (LÓGICA CORRIGIDA) ---
      // ALTERAÇÃO: Esta lógica agora roda a cada quadro, de forma independente.
      const { roadSegments: currentRoadSegments } = currentState;
      const topSegment = currentRoadSegments.reduce(
        (top, seg) => (seg.y < top.y ? seg : top),
        currentRoadSegments[0] || null
      );
      
      if (topSegment) {
        // Gera um obstáculo com 3% de chance por quadro
        if (Math.random() < 0.03) { 
          const spawnX = topSegment.x + Math.random() * (topSegment.width - OBSTACLE_SIZE);
          setObstacles(prev => [...prev, { id: Math.random(), x: spawnX, y: -OBSTACLE_SIZE }]);
        }
        // Gera um turbo com 0.8% de chance por quadro
        if (Math.random() < 0.008) { 
          const spawnX = topSegment.x + Math.random() * (topSegment.width - TURBO_SIZE);
          setPowerUps(prev => [...prev, { id: Math.random(), x: spawnX, y: -TURBO_SIZE }]);
        }
      }
    }, 16); 

    return () => clearInterval(gameLoop); 
  }, [gameState, speed, turboBoost]);

  // useEffect para DETECÇÃO DE COLISÃO
  useEffect(() => {
    if (gameState !== 'playing') return;

    const carCenterX = carPosition.x + CAR_SIZE / 2;
    const carCenterY = carPosition.y + CAR_SIZE / 2;
    const carRadius = CAR_SIZE * 0.35; 

    for (const obstacle of obstacles) {
        const dx = carCenterX - (obstacle.x + OBSTACLE_SIZE / 2);
        const dy = carCenterY - (obstacle.y + OBSTACLE_SIZE / 2);
        if (Math.sqrt(dx * dx + dy * dy) < carRadius + (OBSTACLE_SIZE * 0.4)) {
            crashSound.current?.replayAsync();
            setGameState('gameOver');
            return;
        }
    }

    const newPowerUps = powerUps.filter(powerUp => {
        const dx = carCenterX - (powerUp.x + TURBO_SIZE / 2);
        const dy = carCenterY - (powerUp.y + TURBO_SIZE / 2);
        if (Math.sqrt(dx * dx + dy * dy) < carRadius + (TURBO_SIZE / 2)) {
            setTurboBoost(8); 
            turboSound.current?.replayAsync(); 
            setTimeout(() => setTurboBoost(0), 2000); 
            return false;
        }
        return true;
    });

    if (newPowerUps.length !== powerUps.length) {
      setPowerUps(newPowerUps);
    }
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
            <View key={segment.id} style={[styles.roadSegment, { top: segment.y, left: segment.x, width: segment.width }]} />
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