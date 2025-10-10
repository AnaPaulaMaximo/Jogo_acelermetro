import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type Props = {
  score: number;
  onRestart: () => void;
};

const GameOverScreen: React.FC<Props> = ({ score, onRestart }) => {
  return (
    <LinearGradient colors={['#c0392b', '#8e44ad']} style={styles.container}>
      <Text style={styles.title}>Fim de Jogo!</Text>
      <Text style={styles.score}>Sua pontuação final:</Text>
      <Text style={styles.scoreNumber}>{score}</Text>
      <Pressable style={styles.button} onPress={onRestart}>
        <Text style={styles.buttonText}>Jogar Novamente</Text>
      </Pressable>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ecf0f1',
    marginBottom: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  score: {
    fontSize: 24,
    color: '#ecf0f1',
    marginBottom: 10,
  },
  scoreNumber: {
    fontSize: 60,
    fontWeight: 'bold',
    color: '#f1c40f',
    marginBottom: 40,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  button: {
    backgroundColor: '#2980b9',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 50,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default GameOverScreen;