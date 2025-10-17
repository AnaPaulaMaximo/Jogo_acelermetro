import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type Props = {
  score: number;
  onRestart: () => void;
};

const GameOverScreen: React.FC<Props> = ({ score, onRestart }) => {
  return (
    // 1. Alterado o gradiente para combinar com a tela de início
    <LinearGradient colors={['#4c4c4c', '#1a1a1a']} style={styles.container}>
      <Text style={styles.title}>Fim de Jogo!</Text>
      
      <Text style={styles.scoreLabel}>Sua pontuação final:</Text>
      <Text style={styles.score}>{score}</Text>

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
    padding: 20, // Adicionado para consistência
  },
  title: {
    // 2. Estilo do título atualizado para corresponder à tela inicial
    fontSize: 60,
    fontWeight: 'bold',
    color: '#e74c3c', // Cor vermelha da tela inicial
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
    marginBottom: 30, // Espaçamento ajustado
  },
  scoreLabel: {
    // 3. Estilo para o texto "Sua pontuação"
    fontSize: 18,
    color: '#ecf0f1', // Cor branca da tela inicial
    textAlign: 'center',
    marginBottom: 10,
  },
  score: {
    // 4. Estilo para o número da pontuação
    fontSize: 72, // Aumentado para dar mais destaque
    fontWeight: 'bold',
    color: '#f1c40f', // Mantido amarelo para destaque, como um "prêmio"
    marginBottom: 40,
    textShadowColor: 'rgba(0, 0, 0, 0.75)', // Sombra igual ao título
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  button: {
    // 5. Estilo do botão atualizado para corresponder à tela inicial
    backgroundColor: '#e74c3c', // Cor vermelha
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
    marginBottom: 70, // Adicionado para consistência de layout
  },
  buttonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default GameOverScreen;