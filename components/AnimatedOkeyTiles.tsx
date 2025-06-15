// components/AnimatedOkeyTiles.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, Animated, Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type ColorType = 'red' | 'black';

interface TileData {
  id: number;
  value: number;
  color: ColorType;
  startX: number;
  delay: number;
  opacity: number;
  scale: number;
  fallDuration: number;
  rotationSpeed: number;
  rotationDirection: number;
}

interface OkeyTileProps {
  value: number;
  color: ColorType;
  startX: number;
  delay: number;
  opacity: number;
  scale: number;
  fallDuration: number;
  rotationSpeed: number;
  rotationDirection: number;
}

const OkeyTile: React.FC<OkeyTileProps> = ({ 
  value, 
  color, 
  startX,
  delay, 
  opacity, 
  scale,
  fallDuration,
  rotationSpeed,
  rotationDirection
}) => {
  const translateY = new Animated.Value(-100);
  const rotate = new Animated.Value(0);
  const fadeOpacity = new Animated.Value(0);

  const colorMap: Record<ColorType, string> = {
    red: '#dc2626',
    black: '#1f2937',
  };

  // Get the suit symbol based on color (like real Okey tiles)
  const getSuitSymbol = (color: ColorType): string => {
    switch (color) {
      case 'red': return '♦'; // Diamond
      case 'black': return '♠'; // Spade  
      case 'black': return '♣'; // Club
      case 'red': return '♥'; // Heart
      default: return '♥';
    }
  };

  useEffect(() => {
    Animated.timing(fadeOpacity, {
      toValue: opacity,
      duration: 1000,
      delay: delay * 1000,
      useNativeDriver: true,
    }).start();

    const fallAnimation = () => {
      translateY.setValue(-100);
      Animated.timing(translateY, {
        toValue: screenHeight + 100,
        duration: fallDuration,
        useNativeDriver: true,
      }).start(() => {
        fallAnimation();
      });
    };

    const rotationAnimation = () => {
      Animated.loop(
        Animated.timing(rotate, {
          toValue: 1,
          duration: rotationSpeed,
          useNativeDriver: true,
        }),
        { iterations: -1 }
      ).start();
    };

    setTimeout(() => {
      fallAnimation();
      rotationAnimation();
    }, delay * 1000);

  }, [translateY, rotate, fadeOpacity, delay, fallDuration, rotationSpeed, opacity]);

  const rotateInterpolation = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', `${360 * rotationDirection}deg`],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: 48 * scale,
        height: 64 * scale,
        backgroundColor: '#fefce8',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#fde047',
        left: startX,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        opacity: fadeOpacity,
        transform: [
          { translateY: translateY },
          { rotate: rotateInterpolation },
          { scale: scale }
        ],
      }}
    >
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ 
          fontSize: 20 * scale, 
          fontWeight: 'bold', 
          color: colorMap[color],
          marginTop: -8
        }}>
          {value}
        </Text>
      </View>
      <Text style={{ 
        position: 'absolute', 
        bottom: 4, 
        alignSelf: 'center', 
        fontSize: 12 * scale, 
        color: colorMap[color]
      }}>
        {getSuitSymbol(color)}
      </Text>
    </Animated.View>
  );
};

const AnimatedOkeyTiles: React.FC = () => {
  const [tiles, setTiles] = useState<TileData[]>(() => {
    // İlk render'da bir kez çalışacak şekilde başlangıç state'ini oluştur
    const colors: ColorType[] = ['red', 'black'];
    const newTiles: TileData[] = [];
    const usedXPositions: number[] = [];

    const getSpreadOutXPosition = (): number => {
      const minDistance = 80;
      const maxAttempts = 20;
      
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const newX = Math.random() * (screenWidth - 60);
        
        const tooClose = usedXPositions.some(existingX => 
          Math.abs(newX - existingX) < minDistance
        );
        
        if (!tooClose) {
          usedXPositions.push(newX);
          return newX;
        }
      }
      
      const fallbackX = Math.random() * (screenWidth - 60);
      usedXPositions.push(fallbackX);
      return fallbackX;
    };

    for (let i = 0; i < 12; i++) {
      const tileOpacity = 0.08 + Math.random() * 0.15;
      const tileScale = 0.7 + Math.random() * 0.4;
      
      newTiles.push({
        id: i,
        value: Math.floor(Math.random() * 13) + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        startX: getSpreadOutXPosition(),
        delay: (i * 3) + Math.random() * 2,
        opacity: tileOpacity,
        scale: tileScale,
        fallDuration: 12000 + Math.random() * 8000,
        rotationSpeed: 15000 + Math.random() * 10000,
        rotationDirection: Math.random() < 0.5 ? 1 : -1,
      });
    }

    return newTiles;
  });

  // useEffect'i kaldırdık çünkü artık başlangıç state'ini useState içinde oluşturuyoruz

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} pointerEvents="none">
      {tiles.map((tile) => (
        <OkeyTile key={tile.id} {...tile} />
      ))}
    </View>
  );
};

export default React.memo(AnimatedOkeyTiles);