import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Dimensions, Text, Image, Animated } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import { Audio } from 'expo-av';
import StartScreen from './StartScreen';
import GameOverScreen from './GameOverScreen';

const { width, height } = Dimensions.get('window');
const CAR_SIZE = 70;
const OBSTACLE_SIZE = 50;
const TURBO_SIZE = 40;
const TREE_SIZE = 80;
const INITIAL_SPEED = 4;
const MAX_SPEED = 12;
const INITIAL_TURBO = 100;
const ROAD_SEGMENT_HEIGHT = 20; // Segmentos menores para curvas mais suaves

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
}

export default function EscapeZone() {
  const [accelerometerData, setAccelerometerData] = useState({ x: 0, y: 0, z: 0 });
  const [carPosition, setCarPosition] = useState({ x: width / 2 - CAR_SIZE / 2, y: height - CAR_SIZE * 2 });
  const [carRotation, setCarRotation] = useState(0);
  const [obstacles, setObstacles] = useState<any[]>([]);
  const [powerUps, setPowerUps] = useState<any[]>([]);
  const [roadSegments, setRoadSegments] = useState<RoadSegment[]>([]);
  const [scenery, setScenery] = useState<SceneryObject[]>([]);
  const [curve, setCurve] = useState({ direction: 0, duration: 0 });
  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const [turbo, setTurbo] = useState(INITIAL_TURBO);
  const [turboBoost, setTurboBoost] = useState(0);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameOver'>('start');
  const [lastShake, setLastShake] = useState(0);

  const crashSound = useRef<Audio.Sound | null>(null);
  const turboSound = useRef<Audio.Sound | null>(null);

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
    setTurbo(INITIAL_TURBO);
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

  const handleAccelerometerData = (data: { x: number; y: number; z: number }) => {
    setAccelerometerData(data);
    const shakeThreshold = 1.8;
    const now = Date.now();
    if ((now - lastShake) > 1000 && turboBoost === 0) {
        if ((Math.abs(data.x) > shakeThreshold || Math.abs(data.y) > shakeThreshold || Math.abs(data.z) > shakeThreshold)) {
            if (turbo > 0) {
                setTurboBoost(8); // Adiciona um forte impulso de velocidade
                setTurbo(prev => Math.max(prev - 25, 0));
                turboSound.current?.replayAsync();
                setLastShake(now);
                setTimeout(() => setTurboBoost(0), 2000); // Duração do turbo
            }
        }
    }
  };

  useEffect(() => {
    if (gameState !== 'playing') {
      Accelerometer.removeAllListeners();
      return;
    }
    Accelerometer.setUpdateInterval(16);
    const subscription = Accelerometer.addListener(handleAccelerometerData);
    return () => subscription.remove();
  }, [gameState, turbo, lastShake, turboBoost]);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const steerSensitivity = 0.4;
    const maxAngle = 45;

    let rotationChange = -accelerometerData.y * steerSensitivity * 10;
    let newRotation = carRotation + rotationChange;

    newRotation = Math.max(-maxAngle, Math.min(maxAngle, newRotation));
    setCarRotation(newRotation);

    const angleInRadians = newRotation * (Math.PI / 180);
    let newX = carPosition.x + speed * Math.sin(angleInRadians);

    const carSegment = roadSegments.find(s => carPosition.y >= s.y && carPosition.y < s.y + ROAD_SEGMENT_HEIGHT);
    
    // **AJUSTE 2: NÃO PERDE MAIS AO ENCOSTAR NA BORDA**
    if (carSegment) {
        if (newX < carSegment.x) {
            newX = carSegment.x;
        }
        if (newX > carSegment.x + carSegment.width - CAR_SIZE) {
            newX = carSegment.x + carSegment.width - CAR_SIZE;
        }
    } else if(roadSegments.length > 0) {
        // Se o carro sair da pista visível, fim de jogo
        crashSound.current?.replayAsync();
        setGameState('gameOver');
    }

    setCarPosition({ ...carPosition, x: newX });

  }, [accelerometerData, gameState, speed]);

  useEffect(() => {
    if (gameState !== 'playing') return;

    // **AJUSTE 1: VELOCIDADE EFETIVA COM TURBO**
    const effectiveSpeed = speed + turboBoost;

    const gameLoop = setInterval(() => {
      setScore(prev => prev + 1);

      setObstacles(prev => prev.map(o => ({ ...o, y: o.y + effectiveSpeed })).filter(o => o.y < height + OBSTACLE_SIZE));
      setPowerUps(prev => prev.map(p => ({ ...p, y: p.y + effectiveSpeed })).filter(p => p.y < height + TURBO_SIZE));
      setScenery(prev => prev.map(s => ({ ...s, y: s.y + effectiveSpeed })).filter(s => s.y < height + TREE_SIZE));


      setRoadSegments(prev => {
        const movedSegments = prev
          .map(segment => ({ ...segment, y: segment.y + effectiveSpeed }))
          .filter(segment => segment.y < height + ROAD_SEGMENT_HEIGHT);

        const lastSegment = movedSegments[movedSegments.length - 1];

        if (lastSegment && lastSegment.y > -ROAD_SEGMENT_HEIGHT * 5) {
            const difficulty = Math.min(score / 15000, 1);
            
            let newCurve = { ...curve };
            if(curve.duration <= 0) {
                const newDirection = Math.random() > 0.4 ? (Math.random() > 0.5 ? 1 : -1) : 0;
                newCurve = {
                    direction: newDirection,
                    duration: Math.floor(Math.random() * 100 + 80)
                }
                setCurve(newCurve);
            } else {
                setCurve(c => ({...c, duration: c.duration - 1}));
            }

            const newWidth = width * (0.6 - (0.35 * difficulty));
            const curveStrength = newCurve.direction * (1 + 3 * difficulty);
            let newX = lastSegment.x + curveStrength;
            
            if (newX < 0) newX = 0;
            if (newX + newWidth > width) newX = width - newWidth;

            const newSegment: RoadSegment = {
                id: Math.random(),
                y: lastSegment.y - ROAD_SEGMENT_HEIGHT,
                x: newX,
                width: newWidth,
            };

            if (Math.random() < 0.15) {
                const side = Math.random() > 0.5 ? 1 : -1;
                const treeX = side > 0 ? newSegment.x + newSegment.width + Math.random() * 80 : newSegment.x - 60 - Math.random() * 80;
                setScenery(prevScenery => [...prevScenery, {id: Math.random(), x: treeX, y: newSegment.y, size: Math.random() * 50 + 40}]);
            }

            return [ ...movedSegments, newSegment];
        }
        return movedSegments;
      });

      const currentSegmentForSpawning = roadSegments.find(s => s.y > -ROAD_SEGMENT_HEIGHT && s.y < 0);
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
  }, [gameState, speed, turboBoost, score, roadSegments, curve]);

  // **AJUSTE 3: DETECÇÃO DE COLISÃO POR RAIO (MAIS JUSTA)**
  useEffect(() => {
    if (gameState !== 'playing') return;

    const carCenterX = carPosition.x + CAR_SIZE / 2;
    const carCenterY = carPosition.y + CAR_SIZE / 2;
    const carRadius = CAR_SIZE * 0.35; // Raio de colisão menor que o tamanho da imagem

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

    powerUps.forEach(powerUp => {
        const powerUpCenterX = powerUp.x + TURBO_SIZE / 2;
        const powerUpCenterY = powerUp.y + TURBO_SIZE / 2;
        const powerUpRadius = TURBO_SIZE / 2;

        const dx = carCenterX - powerUpCenterX;
        const dy = carCenterY - powerUpCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < carRadius + powerUpRadius) {
            setTurbo(prev => Math.min(prev + 25, INITIAL_TURBO));
            setPowerUps(prev => prev.filter(p => p.id !== powerUp.id));
        }
    });
  }, [carPosition, obstacles, powerUps, gameState]);

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
                style={[
                    styles.roadSegment,
                    {
                        top: segment.y,
                        left: segment.x,
                        width: segment.width,
                    },
                ]}
            />
        ))}

      <View style={styles.hud}>
        <Text style={styles.hudText}>Pontos: {score}</Text>
        <View>
          <Text style={styles.hudText}>Turbo: {turbo}%</Text>
          <View style={styles.turboBar}><View style={{width: `${turbo}%`, ...styles.turboFill}}/></View>
        </View>
      </View>

      {obstacles.map(o => (
        <Image key={o.id} source={require('../../assets/images/cone.png')} style={[styles.item, { width: OBSTACLE_SIZE, height: OBSTACLE_SIZE, left: o.x, top: o.y }]} />
      ))}
      {powerUps.map(p => (
        <Image key={p.id} source={require('../../assets/images/turbo.png')} style={[styles.item, { width: TURBO_SIZE, height: TURBO_SIZE, left: p.x, top: p.y }]} />
      ))}


      <Image
        source={require('../../assets/images/car.png')}
        style={[
          styles.car,
          {
            left: carPosition.x,
            top: carPosition.y,
            transform: [{ rotate: `${carRotation}deg` }],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#27ae60', // Cor da grama
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
  hud: {
    position: 'absolute',
    top: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 10,
  },
  hudText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  turboBar: {
      height: 10,
      width: 100,
      backgroundColor: 'rgba(255,255,255,0.3)',
      borderRadius: 5,
      marginTop: 5,
  },
  turboFill: {
      height: '100%',
      backgroundColor: '#f1c40f',
      borderRadius: 5,
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